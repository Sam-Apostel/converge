/**
 * Server functions backing the AI settings screen (silo 7).
 *
 * Keys are write-only from the client's perspective: we accept a plaintext key,
 * encrypt it at rest, and only ever report back whether one is set — never the
 * value. All of this runs server-side (createServerFn).
 */
import { createServerFn } from '@tanstack/react-start'

import { db } from '#/db'
import { userAiSettings } from '#/db/domain-schema'

import { encrypt, decrypt } from './crypto'
import {
  PROVIDERS,
  PROVIDER_LABELS,
  buildAdapter,
  devModel,
  loadSettings,
  ollamaBaseUrl,
  ollamaReachable,
  pingAdapter,
  providerNeedsKey,
} from './provider'
import type { ProviderId } from './provider'
import { requireUserId } from '#/lib/server-auth'

/** Non-secret view of a user's settings — safe to send to the client. */
export type AiSettingsView = {
  provider: ProviderId
  model: string | null
  baseUrl: string | null
  hasKey: boolean
}

function coerceProvider(value: string | undefined): ProviderId {
  return (PROVIDERS as ReadonlyArray<string>).includes(value ?? '')
    ? (value as ProviderId)
    : 'ollama'
}

/** Current user's settings, minus the secret. */
export const getAiSettings = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AiSettingsView> => {
    const userId = await requireUserId()
    const row = await loadSettings(userId)
    return {
      provider: coerceProvider(row?.provider),
      model: row?.model ?? null,
      baseUrl: row?.baseUrl ?? null,
      hasKey: Boolean(row?.apiKeyEncrypted),
    }
  },
)

type SaveInput = {
  provider: ProviderId
  model?: string | null
  /** New plaintext key. Empty/omitted = leave the stored key untouched. */
  apiKey?: string | null
  baseUrl?: string | null
  /** Explicitly remove the stored key. */
  clearKey?: boolean
}

/** Persist the user's provider/model/key. */
export const saveAiSettings = createServerFn({ method: 'POST' })
  .validator((d: SaveInput): SaveInput => d)
  .handler(async ({ data }): Promise<AiSettingsView> => {
    const userId = await requireUserId()
    const provider = coerceProvider(data.provider)
    const model = data.model?.trim() || null
    const baseUrl = data.baseUrl?.trim() || null

    // Resolve the key column: clear, set-new, or keep-existing.
    let apiKeyEncrypted: string | null | undefined
    if (data.clearKey) {
      apiKeyEncrypted = null
    } else if (data.apiKey && data.apiKey.trim()) {
      apiKeyEncrypted = encrypt(data.apiKey.trim())
    } else {
      apiKeyEncrypted = undefined // keep whatever is stored
    }

    const insertValues = {
      userId,
      provider,
      model,
      baseUrl,
      apiKeyEncrypted: apiKeyEncrypted ?? null,
    }
    const updateValues: Record<string, unknown> = {
      provider,
      model,
      baseUrl,
      updatedAt: new Date(),
    }
    if (apiKeyEncrypted !== undefined)
      updateValues.apiKeyEncrypted = apiKeyEncrypted

    await db
      .insert(userAiSettings)
      .values(insertValues)
      .onConflictDoUpdate({ target: userAiSettings.userId, set: updateValues })

    const row = await loadSettings(userId)
    return {
      provider: coerceProvider(row?.provider),
      model: row?.model ?? null,
      baseUrl: row?.baseUrl ?? null,
      hasKey: Boolean(row?.apiKeyEncrypted),
    }
  })

type TestInput = {
  provider: ProviderId
  model?: string | null
  /** Optional unsaved key from the form; falls back to the stored key. */
  apiKey?: string | null
  baseUrl?: string | null
}

/** Validate a provider configuration end-to-end with a one-shot request. */
export const testAiConnection = createServerFn({ method: 'POST' })
  .validator((d: TestInput): TestInput => d)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const userId = await requireUserId()
    const provider = coerceProvider(data.provider)
    const baseUrl = data.baseUrl?.trim() || undefined
    const model =
      data.model?.trim() || (provider === 'ollama' ? devModel() : '')

    if (provider === 'ollama') {
      const reachable = await ollamaReachable(baseUrl ?? ollamaBaseUrl())
      return reachable
        ? { ok: true }
        : {
            ok: false,
            error: `No Ollama server at ${baseUrl ?? ollamaBaseUrl()}`,
          }
    }

    if (!model) return { ok: false, error: 'Enter a model id to test.' }

    // Use the typed-in key if present, otherwise the stored one.
    let apiKey = data.apiKey?.trim() || undefined
    if (!apiKey) {
      const stored = await loadSettings(userId)
      if (stored?.apiKeyEncrypted) apiKey = decrypt(stored.apiKeyEncrypted)
    }
    if (providerNeedsKey(provider) && !apiKey) {
      return { ok: false, error: 'No API key provided or stored.' }
    }

    return pingAdapter(buildAdapter({ provider, model, apiKey, baseUrl }))
  })

/** Status for the concierge screen's graceful-degradation notice. */
export type ConciergeStatus = {
  provider: ProviderId
  providerLabel: string
  model: string
  source: 'user' | 'dev'
  /** Whether a model is actually reachable right now. */
  ready: boolean
}

export const getConciergeStatus = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ConciergeStatus> => {
    const userId = await requireUserId()
    const settings = await loadSettings(userId)
    const provider = coerceProvider(settings?.provider)

    const usingUserProvider =
      Boolean(settings) &&
      provider !== 'ollama' &&
      Boolean(settings?.apiKeyEncrypted) &&
      Boolean(settings?.model)

    if (usingUserProvider) {
      return {
        provider,
        providerLabel: PROVIDER_LABELS[provider],
        model: settings!.model!,
        source: 'user',
        // Assume a stored, configured key is usable; "test connection" verifies.
        ready: true,
      }
    }

    const model =
      provider === 'ollama' && settings?.model ? settings.model : devModel()
    return {
      provider: 'ollama',
      providerLabel: PROVIDER_LABELS.ollama,
      model,
      source: settings && provider === 'ollama' ? 'user' : 'dev',
      ready: await ollamaReachable(settings?.baseUrl ?? ollamaBaseUrl()),
    }
  },
)

/**
 * Provider resolution for the AI concierge (silo 7).
 *
 * Given the current user, build the right TanStack AI text adapter:
 *   - if they've configured a provider + model (+ key) in `userAiSettings`,
 *     build that adapter with their decrypted key;
 *   - otherwise fall back to the local Ollama dev adapter (no key, no cost).
 *
 * Server-only: imports `#/db` and the crypto module. Never import from a
 * client component.
 */
import { eq } from 'drizzle-orm'
import { chat } from '@tanstack/ai'
import type { AnyTextAdapter } from '@tanstack/ai/adapters'
import { createOllamaChat } from '@tanstack/ai-ollama'
import { createOpenaiChat } from '@tanstack/ai-openai'
import { createAnthropicChat } from '@tanstack/ai-anthropic'
import { createOpenRouterText } from '@tanstack/ai-openrouter'

import { db } from '#/db'
import { userAiSettings } from '#/db/domain-schema'

import { decrypt } from './crypto'

export const PROVIDERS = [
  'ollama',
  'openai',
  'anthropic',
  'openrouter',
] as const
export type ProviderId = (typeof PROVIDERS)[number]

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  ollama: 'Ollama (local)',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  openrouter: 'OpenRouter',
}

/**
 * Curated model choices per online provider, surfaced as a dropdown in the AI
 * settings UI. The first entry is treated as the recommended default. BYOK
 * still passes the chosen string straight through to the provider, so this is a
 * convenience list — refresh it as providers ship new models. Ollama is omitted
 * on purpose: local model tags vary per machine, so that field stays free text.
 */
export const PROVIDER_MODELS: Record<Exclude<ProviderId, 'ollama'>, string[]> = {
  anthropic: [
    'claude-opus-4-8',
    'claude-sonnet-4-6',
    'claude-haiku-4-5',
    'claude-opus-4-7',
  ],
  openai: ['gpt-5.4', 'gpt-5.4-mini', 'gpt-5', 'gpt-4.1-mini'],
  openrouter: [
    'anthropic/claude-sonnet-4-6',
    'anthropic/claude-opus-4-8',
    'openai/gpt-5.4',
    'meta-llama/llama-3.1-70b-instruct',
  ],
}

/** Providers that require an API key (everything except local Ollama). */
export function providerNeedsKey(provider: ProviderId): boolean {
  return provider !== 'ollama'
}

/** Does this provider expose a curated model dropdown (vs. free-text)? */
export function providerHasModelList(
  provider: ProviderId,
): provider is Exclude<ProviderId, 'ollama'> {
  return provider !== 'ollama'
}

export type AiSettingsRow = typeof userAiSettings.$inferSelect

/** Local Ollama base URL (brief: `OLLAMA_BASE_URL`, default localhost:11434). */
export function ollamaBaseUrl(): string {
  return process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
}

/** Default dev model for the Ollama fallback (brief: `CONCIERGE_DEV_MODEL`). */
export function devModel(): string {
  return process.env.CONCIERGE_DEV_MODEL ?? 'llama3.1'
}

/** Load a user's stored AI settings, or `null` when they haven't configured any. */
export async function loadSettings(
  userId: string,
): Promise<AiSettingsRow | null> {
  const rows = await db
    .select()
    .from(userAiSettings)
    .where(eq(userAiSettings.userId, userId))
    .limit(1)
  return rows.length > 0 ? rows[0] : null
}

export type ResolvedProvider = {
  adapter: AnyTextAdapter
  provider: ProviderId
  model: string
  /** `'user'` = built from the user's BYOK settings; `'dev'` = Ollama fallback. */
  source: 'user' | 'dev'
}

/**
 * Build a text adapter from explicit parameters. The model strings are cast
 * because BYOK lets the user enter any model id — the literal-union types in
 * the adapter factories are autocomplete hints, and the value is passed
 * through to the provider unchanged.
 */
export function buildAdapter(params: {
  provider: ProviderId
  model: string
  apiKey?: string
  baseUrl?: string
}): AnyTextAdapter {
  const { provider, model, apiKey, baseUrl } = params
  switch (provider) {
    case 'openai':
      return createOpenaiChat(
        model as Parameters<typeof createOpenaiChat>[0],
        apiKey ?? '',
      )
    case 'anthropic':
      return createAnthropicChat(
        model as Parameters<typeof createAnthropicChat>[0],
        apiKey ?? '',
      )
    case 'openrouter':
      return createOpenRouterText(
        model as Parameters<typeof createOpenRouterText>[0],
        apiKey ?? '',
      )
    case 'ollama':
    default:
      return createOllamaChat(model, baseUrl ?? ollamaBaseUrl())
  }
}

/**
 * Resolve the adapter to use for a chat request. Falls back to local Ollama
 * whenever the user has no settings, picked Ollama, or selected a key-based
 * provider without a stored key.
 */
export async function resolveProvider(
  userId: string,
): Promise<ResolvedProvider> {
  const settings = await loadSettings(userId)
  const provider = (settings?.provider as ProviderId | undefined) ?? 'ollama'

  if (
    settings &&
    provider !== 'ollama' &&
    settings.apiKeyEncrypted &&
    settings.model
  ) {
    return {
      adapter: buildAdapter({
        provider,
        model: settings.model,
        apiKey: decrypt(settings.apiKeyEncrypted),
        baseUrl: settings.baseUrl ?? undefined,
      }),
      provider,
      model: settings.model,
      source: 'user',
    }
  }

  // Ollama (either explicitly chosen, or the fallback).
  const model =
    provider === 'ollama' && settings?.model ? settings.model : devModel()
  return {
    adapter: buildAdapter({
      provider: 'ollama',
      model,
      baseUrl: settings?.baseUrl ?? undefined,
    }),
    provider: 'ollama',
    model,
    source: settings && provider === 'ollama' ? 'user' : 'dev',
  }
}

/** Is the local Ollama server reachable? Used for graceful-degradation hints. */
export async function ollamaReachable(
  baseUrl = ollamaBaseUrl(),
): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/tags`, {
      signal: AbortSignal.timeout(2500),
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Try a one-shot generation against an adapter and report success/failure.
 * Used by the settings "test connection" affordance. Consumes the (tiny)
 * stream, surfacing `RUN_ERROR` events as failures.
 */
export async function pingAdapter(adapter: AnyTextAdapter): Promise<{
  ok: boolean
  error?: string
}> {
  try {
    const stream = chat({
      adapter,
      messages: [
        {
          id: 'ping',
          role: 'user',
          parts: [{ type: 'text', content: 'ping' }],
        },
      ],
      systemPrompts: ['Reply with the single word: ok.'],
    })
    for await (const chunk of stream as AsyncIterable<{
      type: string
      error?: { message?: string }
    }>) {
      if (chunk.type === 'RUN_ERROR') {
        return { ok: false, error: chunk.error?.message ?? 'Run failed' }
      }
    }
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

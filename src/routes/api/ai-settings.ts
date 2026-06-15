import { createFileRoute } from '@tanstack/react-router'

import { db } from '#/db'
import { userAiSettings } from '#/db/domain-schema'
import { encrypt } from '#/lib/concierge/crypto'
import { loadSettings } from '#/lib/concierge/provider'
import { requireUser } from '#/lib/server-auth'

const PROVIDERS = ['ollama', 'openai', 'anthropic', 'openrouter']
const coerce = (v: string | undefined | null) =>
  PROVIDERS.includes(v ?? '') ? (v as string) : 'ollama'

/**
 * AI concierge provider settings for native clients.
 *
 * - `GET`   → `{ provider, model, baseUrl, hasKey }` (never the key itself).
 * - `PATCH` → upsert provider/model/baseUrl and optionally a new plaintext key
 *   (encrypted at rest) or clear it. Mirrors `saveAiSettings`.
 */
export const Route = createFileRoute('/api/ai-settings')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const me = await requireUser(request)
        const row = await loadSettings(me.id)
        return Response.json({
          provider: coerce(row?.provider),
          model: row?.model ?? null,
          baseUrl: row?.baseUrl ?? null,
          hasKey: Boolean(row?.apiKeyEncrypted),
        })
      },

      PATCH: async ({ request }) => {
        const me = await requireUser(request)
        const body = (await request.json()) as {
          provider?: string
          model?: string | null
          apiKey?: string | null
          baseUrl?: string | null
          clearKey?: boolean
        }
        const provider = coerce(body.provider)
        const model = body.model?.trim() || null
        const baseUrl = body.baseUrl?.trim() || null

        let apiKeyEncrypted: string | null | undefined
        if (body.clearKey) {
          apiKeyEncrypted = null
        } else if (body.apiKey && body.apiKey.trim()) {
          apiKeyEncrypted = encrypt(body.apiKey.trim())
        } else {
          apiKeyEncrypted = undefined // keep existing
        }

        const updateValues: Record<string, unknown> = {
          provider,
          model,
          baseUrl,
          updatedAt: new Date(),
        }
        if (apiKeyEncrypted !== undefined) updateValues.apiKeyEncrypted = apiKeyEncrypted

        await db
          .insert(userAiSettings)
          .values({ userId: me.id, provider, model, baseUrl, apiKeyEncrypted: apiKeyEncrypted ?? null })
          .onConflictDoUpdate({ target: userAiSettings.userId, set: updateValues })

        const row = await loadSettings(me.id)
        return Response.json({
          provider: coerce(row?.provider),
          model: row?.model ?? null,
          baseUrl: row?.baseUrl ?? null,
          hasKey: Boolean(row?.apiKeyEncrypted),
        })
      },
    },
  },
})

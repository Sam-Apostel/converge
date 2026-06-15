import { createFileRoute } from '@tanstack/react-router'
import { chat, maxIterations, streamToText } from '@tanstack/ai'
import type { ModelMessage } from '@tanstack/ai'

import { buildRuntimeContext } from '#/lib/concierge/context'
import { resolveProvider } from '#/lib/concierge/provider'
import { buildTools } from '#/lib/concierge/tools'
import { requireUserId } from '#/lib/server-auth'

/**
 * Non-streaming concierge endpoint for native clients. Runs the same tool-use
 * loop as `/api/concierge` but collects the final assistant text with
 * `streamToText` and returns it as plain JSON `{ text }` — far simpler for a
 * Swift client to consume than the TanStack AI UI-stream wire format.
 */
const SYSTEM_PROMPT = `You are the Converge concierge — a warm, concise guide for attendees of \
co-located Amsterdam conferences (JSNation + React Summit).

Converge is people-first: people and the projects they build are the primary \
objects, with talks, moments and discussions woven around them.

You can call read-only tools to answer questions about people, sessions, \
projects and the current user's schedule. Prefer calling a tool over guessing. \
When you reference people, sessions or projects, mention them by name so the UI \
can render them. Keep answers short and conversational. You cannot make changes \
on the user's behalf.`

export const Route = createFileRoute('/api/concierge/ask')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const userId = await requireUserId(request.headers)
        const body = (await request.json()) as {
          messages: Array<{ role: 'user' | 'assistant'; content: string }>
        }
        if (!Array.isArray(body.messages) || body.messages.length === 0) {
          return new Response('messages required', { status: 400 })
        }

        const [{ adapter }, runtimeContext] = await Promise.all([
          resolveProvider(userId),
          buildRuntimeContext(userId),
        ])

        try {
          const stream = chat({
            adapter,
            messages: body.messages as Array<ModelMessage>,
            systemPrompts: [SYSTEM_PROMPT, runtimeContext],
            tools: buildTools(userId),
            agentLoopStrategy: maxIterations(8),
          })
          const text = await streamToText(stream)
          return Response.json({ text })
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Concierge unavailable'
          return Response.json({ error: message }, { status: 502 })
        }
      },
    },
  },
})

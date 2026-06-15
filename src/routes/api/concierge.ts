import { createFileRoute } from '@tanstack/react-router'
import {
  chat,
  chatParamsFromRequest,
  maxIterations,
  toServerSentEventsResponse,
} from '@tanstack/ai'

import { buildRuntimeContext } from '#/lib/concierge/context'
import { resolveProvider } from '#/lib/concierge/provider'
import { buildTools } from '#/lib/concierge/tools'
import { requireUserId } from '#/lib/server-auth'

/**
 * Streaming chat endpoint for the AI concierge (silo 7).
 *
 * Resolves the acting user, picks their configured provider (or the local
 * Ollama fallback), runs the tool-use loop over the read-only Converge tools,
 * and streams the result back as Server-Sent Events.
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

export const Route = createFileRoute('/api/concierge')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const userId = await requireUserId(request.headers)
        const { messages } = await chatParamsFromRequest(request)
        const [{ adapter }, runtimeContext] = await Promise.all([
          resolveProvider(userId),
          buildRuntimeContext(userId),
        ])

        const abortController = new AbortController()
        request.signal.addEventListener('abort', () => abortController.abort())

        const stream = chat({
          adapter,
          messages,
          systemPrompts: [SYSTEM_PROMPT, runtimeContext],
          tools: buildTools(userId),
          agentLoopStrategy: maxIterations(8),
          abortController,
        })

        return toServerSentEventsResponse(stream, { abortController })
      },
    },
  },
})

import { createFileRoute } from '@tanstack/react-router'
import { and, eq } from 'drizzle-orm'

import { db } from '#/db'
import { answer, question, sessionSpeaker } from '#/db/schema'
import { requireUser } from '#/lib/server-auth'

/**
 * Answers API — post a reply to a question. `fromSpeaker` is set server-side
 * when the author is a speaker for the question's session, so a speaker's reply
 * gets its distinct treatment without the client being trusted to assert it.
 */
export const Route = createFileRoute('/api/answers')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { id: userId } = await requireUser(request)
        const payload = (await request.json()) as {
          questionId: string
          body: string
        }
        const text = payload.body?.trim()
        if (!payload.questionId || !text) {
          return new Response('Missing questionId or body', { status: 400 })
        }

        const [q] = await db
          .select({ sessionId: question.sessionId })
          .from(question)
          .where(eq(question.id, payload.questionId))
          .limit(1)
        if (!q) return new Response('Question not found', { status: 404 })

        let fromSpeaker = false
        if (q.sessionId) {
          const [speaker] = await db
            .select({ id: sessionSpeaker.id })
            .from(sessionSpeaker)
            .where(
              and(
                eq(sessionSpeaker.sessionId, q.sessionId),
                eq(sessionSpeaker.userId, userId),
              ),
            )
            .limit(1)
          fromSpeaker = !!speaker
        }

        const [row] = await db
          .insert(answer)
          .values({
            questionId: payload.questionId,
            authorId: userId,
            body: text,
            fromSpeaker,
          })
          .returning()

        // A question with at least one answer is no longer "open".
        await db
          .update(question)
          .set({ status: 'answered' })
          .where(eq(question.id, payload.questionId))

        return Response.json(row, { status: 201 })
      },
    },
  },
})

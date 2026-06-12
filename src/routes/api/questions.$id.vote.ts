import { createFileRoute } from '@tanstack/react-router'
import { and, eq, sql } from 'drizzle-orm'

import { db } from '#/db'
import { question, questionVote } from '#/db/schema'
import { requireUser } from '#/lib/server-auth'

/**
 * Toggle the viewer's upvote on a question. One vote row per (question, user)
 * is the source of truth; `question.upvotes` is the denormalised count kept in
 * step. Returns the updated count and the viewer's new vote state.
 */
export const Route = createFileRoute('/api/questions/$id/vote')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { id: userId } = await requireUser(request)
        const questionId = params.id

        const [existing] = await db
          .select({ id: questionVote.id })
          .from(questionVote)
          .where(
            and(
              eq(questionVote.questionId, questionId),
              eq(questionVote.userId, userId),
            ),
          )
          .limit(1)

        const hasVoted = !existing
        if (existing) {
          await db.delete(questionVote).where(eq(questionVote.id, existing.id))
        } else {
          await db.insert(questionVote).values({ questionId, userId })
        }

        const [updated] = await db
          .update(question)
          .set({
            upvotes: sql`${question.upvotes} + ${hasVoted ? 1 : -1}`,
          })
          .where(eq(question.id, questionId))
          .returning({ upvotes: question.upvotes })

        if (!updated) return new Response('Question not found', { status: 404 })

        return Response.json({ voteCount: updated.upvotes, hasVoted })
      },
    },
  },
})

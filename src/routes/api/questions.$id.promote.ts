import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'

import { db } from '#/db'
import {
  conferenceSession,
  discussion,
  discussionPost,
  question,
} from '#/db/schema'
import { requireUser } from '#/lib/server-auth'

/**
 * Promote a question into a persistent discussion thread:
 *   1. create a `discussion` linked to the session + question,
 *   2. seed it with the question body as the first `discussion_post`,
 *   3. stamp the question's `promotedDiscussionId`.
 * Idempotent — a question already promoted just returns its discussion id.
 */
export const Route = createFileRoute('/api/questions/$id/promote')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { id: userId } = await requireUser(request)
        const questionId = params.id

        const [q] = await db
          .select({
            id: question.id,
            body: question.body,
            sessionId: question.sessionId,
            authorId: question.authorId,
            promotedDiscussionId: question.promotedDiscussionId,
          })
          .from(question)
          .where(eq(question.id, questionId))
          .limit(1)

        if (!q) return new Response('Question not found', { status: 404 })

        // Already promoted — hand back the existing thread.
        if (q.promotedDiscussionId) {
          return Response.json({ discussionId: q.promotedDiscussionId })
        }

        const [sess] = q.sessionId
          ? await db
              .select({
                conferenceId: conferenceSession.conferenceId,
                title: conferenceSession.title,
              })
              .from(conferenceSession)
              .where(eq(conferenceSession.id, q.sessionId))
              .limit(1)
          : []

        const title =
          q.body.length > 80 ? `${q.body.slice(0, 77).trimEnd()}…` : q.body

        const [thread] = await db
          .insert(discussion)
          .values({
            conferenceId: sess?.conferenceId ?? null,
            title,
            topic: sess?.title ?? null,
            sessionId: q.sessionId,
            questionId: q.id,
            createdById: userId,
          })
          .returning({ id: discussion.id })

        // First post copies the question, attributed to the original asker.
        await db.insert(discussionPost).values({
          discussionId: thread.id,
          authorId: q.authorId,
          body: q.body,
        })

        await db
          .update(question)
          .set({ promotedDiscussionId: thread.id, status: 'answered' })
          .where(eq(question.id, q.id))

        return Response.json({ discussionId: thread.id }, { status: 201 })
      },
    },
  },
})

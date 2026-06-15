import { createFileRoute } from '@tanstack/react-router'
import { desc, eq, sql } from 'drizzle-orm'

import { db } from '#/db'
import { discussion, discussionPost, user } from '#/db/schema'
import { requireUser } from '#/lib/server-auth'

/**
 * Discussions surface.
 *
 * - `GET`  → all threads, most recently active first, each with its post count.
 * - `POST` → open a fresh standalone thread:
 *     1. create a `discussion` authored by the signed-in user,
 *     2. seed it with their opening message as the first `discussion_post`.
 */
export const Route = createFileRoute('/api/discussions')({
  server: {
    handlers: {
      GET: async () => {
        const [rows, counts] = await Promise.all([
          db
            .select({
              id: discussion.id,
              title: discussion.title,
              topic: discussion.topic,
              sessionId: discussion.sessionId,
              projectId: discussion.projectId,
              questionId: discussion.questionId,
              createdAt: discussion.createdAt,
              updatedAt: discussion.updatedAt,
              authorName: user.name,
            })
            .from(discussion)
            .leftJoin(user, eq(user.id, discussion.createdById))
            .orderBy(desc(discussion.updatedAt))
            .limit(100),
          db
            .select({
              discussionId: discussionPost.discussionId,
              count: sql<number>`count(*)::int`,
            })
            .from(discussionPost)
            .groupBy(discussionPost.discussionId),
        ])

        const countById = new Map(counts.map((c) => [c.discussionId, c.count]))
        return Response.json(
          rows.map((r) => ({ ...r, postCount: countById.get(r.id) ?? 0 })),
        )
      },

      POST: async ({ request }) => {
        const { id: userId } = await requireUser(request)
        const payload = (await request.json()) as {
          title?: string
          body?: string
        }
        const title = payload.title?.trim()
        const body = payload.body?.trim()
        if (!title) return new Response('Missing title', { status: 400 })
        if (!body) return new Response('Missing body', { status: 400 })

        const [thread] = await db
          .insert(discussion)
          .values({ title, createdById: userId })
          .returning({ id: discussion.id })

        await db.insert(discussionPost).values({
          discussionId: thread.id,
          authorId: userId,
          body,
        })

        return Response.json({ id: thread.id }, { status: 201 })
      },
    },
  },
})

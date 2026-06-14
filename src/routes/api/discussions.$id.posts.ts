import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'

import { db } from '#/db'
import { discussion, discussionPost } from '#/db/schema'
import { publish } from '#/lib/events'
import { requireUser } from '#/lib/server-auth'

/**
 * Post a reply to a discussion thread. Inserts a `discussionPost` row authored
 * by the signed-in user and fans the new post out over SSE on the thread's
 * channel so open threads update live.
 */
export const Route = createFileRoute('/api/discussions/$id/posts')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { id: userId } = await requireUser(request)
        const discussionId = params.id
        const payload = (await request.json()) as {
          body?: string
          parentId?: string
        }
        const text = payload.body?.trim()
        if (!text) return new Response('Missing body', { status: 400 })

        const [thread] = await db
          .select({ id: discussion.id })
          .from(discussion)
          .where(eq(discussion.id, discussionId))
          .limit(1)
        if (!thread) return new Response('Discussion not found', { status: 404 })

        const [row] = await db
          .insert(discussionPost)
          .values({
            discussionId,
            authorId: userId,
            body: text,
            parentId: payload.parentId ?? null,
          })
          .returning()

        publish({
          type: 'discussion.post',
          channel: `discussion:${discussionId}`,
          data: { discussionId, postId: row.id },
        })

        return Response.json(row, { status: 201 })
      },
    },
  },
})

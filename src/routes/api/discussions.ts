import { createFileRoute } from '@tanstack/react-router'

import { db } from '#/db'
import { discussion, discussionPost } from '#/db/schema'
import { requireUser } from '#/lib/server-auth'

/**
 * Open a fresh discussion thread from scratch:
 *   1. create a `discussion` authored by the signed-in user,
 *   2. seed it with their opening message as the first `discussion_post`.
 * The thread carries no question/session link — it's a standalone conversation
 * started straight from the discussions surface.
 */
export const Route = createFileRoute('/api/discussions')({
  server: {
    handlers: {
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

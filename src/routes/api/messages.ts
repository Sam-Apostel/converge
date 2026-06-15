import { createFileRoute } from '@tanstack/react-router'

import { db } from '#/db'
import { message } from '#/db/schema'
import { publish } from '#/lib/events'
import { requireUserId } from '#/lib/server-auth'
import {
  conversationBetween,
  markThreadRead,
  messagesForViewer,
} from '#/lib/queries/messages'

/**
 * Messages API — backs the `messagesCollection` TanStack DB collection.
 *
 * The viewer always comes from the session — never the request. Callers only
 * supply the other side of a message/thread.
 *
 * - `GET  ?with=<id>` → a single conversation; omit `with` for the whole inbox
 * - `POST { toUserId, body }` → send a message (publishes realtime)
 * - `PATCH { with }` → mark a thread read
 */
export const Route = createFileRoute('/api/messages')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const me = await requireUserId(request.headers)
        const withUser = new URL(request.url).searchParams.get('with')
        const rows = withUser
          ? await conversationBetween(me, withUser)
          : await messagesForViewer(me)
        return Response.json(rows)
      },

      POST: async ({ request }) => {
        const fromUserId = await requireUserId(request.headers)
        const body = (await request.json()) as {
          toUserId: string
          body: string
        }
        const [row] = await db
          .insert(message)
          .values({
            fromUserId,
            toUserId: body.toUserId,
            body: body.body,
          })
          .returning()

        const data = {
          id: row.id,
          fromUserId: row.fromUserId,
          toUserId: row.toUserId,
          body: row.body,
          readAt: row.readAt ? row.readAt.toISOString() : null,
          createdAt: row.createdAt.toISOString(),
        }
        // Notify both ends so open inboxes update live.
        publish({
          type: 'message.created',
          data,
          channel: `user:${row.toUserId}`,
        })
        publish({
          type: 'message.created',
          data,
          channel: `user:${row.fromUserId}`,
        })

        return Response.json(data, { status: 201 })
      },

      PATCH: async ({ request }) => {
        const me = await requireUserId(request.headers)
        const body = (await request.json()) as { with: string }
        const updated = await markThreadRead(me, body.with)
        return Response.json({ updated })
      },
    },
  },
})

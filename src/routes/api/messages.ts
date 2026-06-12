import { createFileRoute } from '@tanstack/react-router'

import { db } from '#/db'
import { message } from '#/db/schema'
import { publish } from '#/lib/events'
import {
  conversationBetween,
  markThreadRead,
  messagesForViewer,
  resolveViewer,
} from '#/lib/queries/messages'

/**
 * Messages API — backs the `messagesCollection` TanStack DB collection.
 *
 * - `GET  ?me=<id>`            → every message involving the viewer
 * - `GET  ?me=<id>&with=<id>`  → a single conversation
 * - `POST { fromUserId, toUserId, body }` → send a message (publishes realtime)
 * - `PATCH { me, with }`       → mark a thread read
 *
 * TODO(auth): derive `me` / `fromUserId` from the session instead of the body.
 */
export const Route = createFileRoute('/api/messages')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const me = await resolveViewer(url.searchParams.get('me') ?? undefined)
        const withUser = url.searchParams.get('with')
        const rows = withUser
          ? await conversationBetween(me, withUser)
          : await messagesForViewer(me)
        return Response.json(rows)
      },

      POST: async ({ request }) => {
        const body = (await request.json()) as {
          fromUserId?: string
          toUserId: string
          body: string
        }
        const fromUserId = await resolveViewer(body.fromUserId)
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
        const body = (await request.json()) as { me?: string; with: string }
        const me = await resolveViewer(body.me)
        const updated = await markThreadRead(me, body.with)
        return Response.json({ updated })
      },
    },
  },
})

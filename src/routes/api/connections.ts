import { createFileRoute } from '@tanstack/react-router'
import { and, eq } from 'drizzle-orm'

import { db } from '#/db'
import { connection } from '#/db/schema'
import { resolveViewer } from '#/lib/queries/messages'

/**
 * Connections API — the lasting network that outlives the conference.
 *
 * - `POST { action: 'request', fromUserId?, contactId, note? }`
 * - `POST { action: 'accept',  me?, contactId }`
 *
 * Accepting mirrors the row so both sides see the contact.
 *
 * TODO(auth): derive the acting user from the session instead of the body.
 */
export const Route = createFileRoute('/api/connections')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          action: 'request' | 'accept'
          fromUserId?: string
          me?: string
          contactId: string
          note?: string
        }

        if (body.action === 'request') {
          const fromUserId = await resolveViewer(body.fromUserId)
          const [row] = await db
            .insert(connection)
            .values({
              userId: fromUserId,
              contactId: body.contactId,
              status: 'pending',
              note: body.note ?? null,
            })
            .onConflictDoNothing()
            .returning()
          return Response.json(row ?? null, { status: 201 })
        }

        // accept: `contactId` is the person who requested me.
        const me = await resolveViewer(body.me)
        const other = body.contactId

        await db
          .update(connection)
          .set({ status: 'accepted' })
          .where(
            and(
              eq(connection.userId, other),
              eq(connection.contactId, me),
            ),
          )

        // Mirror so the accepting side has the contact too.
        await db
          .insert(connection)
          .values({ userId: me, contactId: other, status: 'accepted' })
          .onConflictDoNothing()

        return Response.json({ ok: true })
      },
    },
  },
})

import { createFileRoute } from '@tanstack/react-router'
import { and, eq } from 'drizzle-orm'

import { db } from '#/db'
import { connection, profile, user } from '#/db/schema'
import type { Person } from '#/db/types'
import { resolveViewer } from '#/lib/queries/messages'

/**
 * Connections API — the lasting network that outlives the conference.
 *
 * Two POST shapes are supported:
 * - `{ toUserId }`                              → request a connection (pending)
 * - `{ action: 'request', contactId, note? }`  → same, explicit form
 * - `{ action: 'accept',  contactId }`          → accept an incoming request
 *
 * Plus:
 * - `PATCH { id, status: 'accepted' | 'rejected' }` → resolve a request by id
 * - `GET`  → the viewer's connections, each with status + the other person
 *
 * Connections are directed (`userId` → `contactId`). Accepting mirrors the row
 * so both sides see the contact.
 *
 * TODO(auth): derive the acting user from the session (`requireUser`) instead of
 * `resolveViewer`, in step with the rest of the connection/messages subsystem.
 */
export const Route = createFileRoute('/api/connections')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const me = await resolveViewer(
          new URL(request.url).searchParams.get('me') ?? undefined,
        )
        const rows = await db
          .select({ connection, user, profile })
          .from(connection)
          .innerJoin(user, eq(user.id, connection.contactId))
          .leftJoin(profile, eq(profile.userId, connection.contactId))
          .where(eq(connection.userId, me))

        return Response.json(
          rows.map((r) => ({
            id: r.connection.id,
            status: r.connection.status,
            note: r.connection.note,
            connectedAt: r.connection.createdAt,
            person: {
              id: r.user.id,
              name: r.user.name,
              image: r.user.image,
              profile: r.profile,
            } satisfies Person,
          })),
        )
      },

      POST: async ({ request }) => {
        const body = (await request.json()) as {
          action?: 'request' | 'accept'
          fromUserId?: string
          me?: string
          toUserId?: string
          contactId?: string
          note?: string
        }

        // Accept an incoming request: `contactId` is the person who requested me.
        if (body.action === 'accept') {
          const me = await resolveViewer(body.me)
          const other = body.contactId
          if (!other) return new Response('Missing contactId', { status: 400 })

          await db
            .update(connection)
            .set({ status: 'accepted' })
            .where(
              and(eq(connection.userId, other), eq(connection.contactId, me)),
            )

          // Mirror so the accepting side has the contact too.
          await db
            .insert(connection)
            .values({ userId: me, contactId: other, status: 'accepted' })
            .onConflictDoNothing()

          return Response.json({ ok: true })
        }

        // Request a connection. `toUserId` (preferred) or `contactId`.
        const contactId = body.toUserId ?? body.contactId
        if (!contactId) return new Response('Missing toUserId', { status: 400 })
        const fromUserId = await resolveViewer(body.fromUserId ?? body.me)

        const [row] = await db
          .insert(connection)
          .values({
            userId: fromUserId,
            contactId,
            status: 'pending',
            note: body.note ?? null,
          })
          .onConflictDoNothing()
          .returning()

        // Already requested before — surface the existing row so the client can
        // still reflect the right state.
        if (!row) {
          const [existing] = await db
            .select()
            .from(connection)
            .where(
              and(
                eq(connection.userId, fromUserId),
                eq(connection.contactId, contactId),
              ),
            )
            .limit(1)
          return Response.json(existing ?? null, { status: 200 })
        }

        return Response.json(row, { status: 201 })
      },

      PATCH: async ({ request }) => {
        const body = (await request.json()) as {
          id?: string
          me?: string
          status: 'accepted' | 'rejected'
        }
        if (body.status !== 'accepted' && body.status !== 'rejected') {
          return new Response('Invalid status', { status: 400 })
        }
        const me = await resolveViewer(body.me)
        if (!body.id) return new Response('Missing id', { status: 400 })

        // The id refers to the incoming request (its `contactId` is me).
        const [row] = await db
          .update(connection)
          .set({ status: body.status })
          .where(and(eq(connection.id, body.id), eq(connection.contactId, me)))
          .returning()
        if (!row) return new Response('Not found', { status: 404 })

        // Mirror an accept so both sides hold the contact.
        if (body.status === 'accepted') {
          await db
            .insert(connection)
            .values({ userId: me, contactId: row.userId, status: 'accepted' })
            .onConflictDoNothing()
        }

        return Response.json(row)
      },
    },
  },
})

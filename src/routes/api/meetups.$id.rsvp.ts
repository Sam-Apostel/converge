import { createFileRoute } from '@tanstack/react-router'
import { and, eq } from 'drizzle-orm'

import { db } from '#/db'
import { meetup, meetupAttendee } from '#/db/schema'
import { requireUser } from '#/lib/server-auth'

/**
 * RSVP the signed-in user to a meetup. Idempotent — re-POSTing is a no-op (the
 * unique index keeps one row per (meetup, user)). DELETE cancels the RSVP.
 */
export const Route = createFileRoute('/api/meetups/$id/rsvp')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { id: userId } = await requireUser(request)
        const meetupId = params.id

        const [exists] = await db
          .select({ id: meetup.id })
          .from(meetup)
          .where(eq(meetup.id, meetupId))
          .limit(1)
        if (!exists) return new Response('Meetup not found', { status: 404 })

        await db
          .insert(meetupAttendee)
          .values({ meetupId, userId })
          .onConflictDoNothing()

        return Response.json({ meetupId, attending: true }, { status: 201 })
      },
      DELETE: async ({ request, params }) => {
        const { id: userId } = await requireUser(request)
        await db
          .delete(meetupAttendee)
          .where(
            and(
              eq(meetupAttendee.meetupId, params.id),
              eq(meetupAttendee.userId, userId),
            ),
          )
        return Response.json({ meetupId: params.id, attending: false })
      },
    },
  },
})

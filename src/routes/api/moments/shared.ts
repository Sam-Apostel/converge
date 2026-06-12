import { createFileRoute } from '@tanstack/react-router'
import { and, asc, eq, gte, lte, ne } from 'drizzle-orm'

import { db } from '#/db'
import { moment, user } from '#/db/schema'
import { requireUser } from '#/lib/server-auth'

/**
 * Shared-moment lookup — the social layer behind a `MomentCard`.
 *
 * `GET /api/moments/shared?sessionId=X&timestampMs=Y&windowMs=30000` returns up
 * to 5 *other* attendees who bookmarked the same passage (within ±windowMs of
 * `timestampMs` in the same talk), so the card can show "you weren't the only
 * one who kept this". The requesting viewer is excluded; each person appears
 * once even if they saved several nearby moments.
 */

export type SharedMomentPerson = {
  userId: string
  name: string
  avatarUrl: string | null
}

export const Route = createFileRoute('/api/moments/shared')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams
        const sessionId = params.get('sessionId')
        const timestampMs = Number(params.get('timestampMs'))
        if (!sessionId || !Number.isFinite(timestampMs)) {
          return Response.json([], { status: 400 })
        }
        const windowMs = Number(params.get('windowMs')) || 30_000

        const { id: viewerId } = await requireUser(request)

        const rows = await db
          .select({
            userId: user.id,
            name: user.name,
            avatarUrl: user.image,
          })
          .from(moment)
          .innerJoin(user, eq(user.id, moment.userId))
          .where(
            and(
              eq(moment.sessionId, sessionId),
              ne(moment.userId, viewerId),
              gte(moment.timestampMs, timestampMs - windowMs),
              lte(moment.timestampMs, timestampMs + windowMs),
            ),
          )
          .orderBy(asc(moment.timestampMs))

        // One entry per person even if they kept several nearby moments.
        const seen = new Set<string>()
        const people: Array<SharedMomentPerson> = []
        for (const r of rows) {
          if (seen.has(r.userId)) continue
          seen.add(r.userId)
          people.push(r)
          if (people.length === 5) break
        }

        return Response.json(people)
      },
    },
  },
})

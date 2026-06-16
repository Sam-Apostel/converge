import { createFileRoute } from '@tanstack/react-router'
import { and, asc, eq, inArray, or } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'

import { db } from '#/db'
import { conference, conferenceSession, profile, sessionSpeaker, user } from '#/db/schema'

/**
 * Conference sessions (talks), ordered by start time, each with its speakers.
 * Optionally scoped to one conference with `?conference=<id|slug>`.
 */
export const Route = createFileRoute('/api/sessions')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const ref = new URL(request.url).searchParams.get('conference')

        const filters: Array<SQL> = []
        if (ref) {
          const [match] = await db
            .select({ id: conference.id })
            .from(conference)
            .where(or(eq(conference.id, ref), eq(conference.slug, ref)))
            .limit(1)
          filters.push(eq(conferenceSession.conferenceId, match?.id ?? '\0'))
        }

        const rows = await db
          .select()
          .from(conferenceSession)
          .where(filters.length ? and(...filters) : undefined)
          .orderBy(asc(conferenceSession.startsAt))
          .limit(200)

        // Attach speakers (id, name, image) per session in one extra query.
        const ids = rows.map((r) => r.id)
        const speakerRows = ids.length
          ? await db
              .select({
                sessionId: sessionSpeaker.sessionId,
                id: user.id,
                name: user.name,
                image: user.image,
                headline: profile.headline,
              })
              .from(sessionSpeaker)
              .innerJoin(user, eq(user.id, sessionSpeaker.userId))
              .leftJoin(profile, eq(profile.userId, user.id))
              .where(inArray(sessionSpeaker.sessionId, ids))
          : []

        const bySession = new Map<string, Array<unknown>>()
        for (const s of speakerRows) {
          const list = bySession.get(s.sessionId) ?? []
          list.push({ id: s.id, name: s.name, image: s.image, headline: s.headline })
          bySession.set(s.sessionId, list)
        }

        return Response.json(
          rows.map((r) => ({ ...r, speakers: bySession.get(r.id) ?? [] })),
        )
      },
    },
  },
})

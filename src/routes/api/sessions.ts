import { createFileRoute } from '@tanstack/react-router'
import { and, asc, eq, or } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'

import { db } from '#/db'
import { conference, conferenceSession } from '#/db/schema'

/**
 * Conference sessions (talks), ordered by start time. Optionally scoped to one
 * conference with `?conference=<id|slug>`.
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
          // An unknown ref yields an empty result rather than the full list.
          filters.push(eq(conferenceSession.conferenceId, match?.id ?? '\0'))
        }

        const rows = await db
          .select()
          .from(conferenceSession)
          .where(filters.length ? and(...filters) : undefined)
          .orderBy(asc(conferenceSession.startsAt))
          .limit(200)
        return Response.json(rows)
      },
    },
  },
})

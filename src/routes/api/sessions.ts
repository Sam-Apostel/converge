import { createFileRoute } from '@tanstack/react-router'
import { asc } from 'drizzle-orm'

import { db } from '#/db'
import { conferenceSession } from '#/db/schema'

/** Conference sessions (talks), ordered by start time. */
export const Route = createFileRoute('/api/sessions')({
  server: {
    handlers: {
      GET: async () => {
        const rows = await db
          .select()
          .from(conferenceSession)
          .orderBy(asc(conferenceSession.startsAt))
          .limit(200)
        return Response.json(rows)
      },
    },
  },
})

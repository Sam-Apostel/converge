import { createFileRoute } from '@tanstack/react-router'
import { desc, eq } from 'drizzle-orm'

import { db } from '#/db'
import { conferenceSession, moment } from '#/db/schema'
import { requireUser } from '#/lib/server-auth'

/**
 * The viewer's moments across every session, newest first — the cross-session
 * "My moments" library. Each row links back to its talk via the session slug.
 */
export const Route = createFileRoute('/api/moments/mine')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const me = await requireUser(request)
        const rows = await db
          .select({
            id: moment.id,
            sessionId: moment.sessionId,
            sessionSlug: conferenceSession.slug,
            sessionTitle: conferenceSession.title,
            timestampMs: moment.timestampMs,
            transcriptSnippet: moment.transcriptSnippet,
            slideRef: moment.slideRef,
            note: moment.note,
            aiHighlight: moment.aiHighlight,
            createdAt: moment.createdAt,
          })
          .from(moment)
          .innerJoin(conferenceSession, eq(conferenceSession.id, moment.sessionId))
          .where(eq(moment.userId, me.id))
          .orderBy(desc(moment.createdAt))
        return Response.json(rows)
      },
    },
  },
})

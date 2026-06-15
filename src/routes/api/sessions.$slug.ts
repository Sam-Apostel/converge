import { createFileRoute } from '@tanstack/react-router'
import { asc, eq } from 'drizzle-orm'

import { db } from '#/db'
import {
  conferenceSession,
  discussion,
  profile,
  room,
  sessionResource,
  sessionSpeaker,
  user,
} from '#/db/schema'

/**
 * Full session detail for the live-session screen: the talk, its speakers (with
 * profile bits), shared resources, room, and any related discussion thread.
 */
export const Route = createFileRoute('/api/sessions/$slug')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const [row] = await db
          .select({ session: conferenceSession, roomName: room.name })
          .from(conferenceSession)
          .leftJoin(room, eq(room.id, conferenceSession.roomId))
          .where(eq(conferenceSession.slug, params.slug))
          .limit(1)
        if (!row) return new Response('Not found', { status: 404 })

        const [speakers, resources, related] = await Promise.all([
          db
            .select({
              id: user.id,
              name: user.name,
              image: user.image,
              headline: profile.headline,
              title: profile.title,
              company: profile.company,
            })
            .from(sessionSpeaker)
            .innerJoin(user, eq(user.id, sessionSpeaker.userId))
            .leftJoin(profile, eq(profile.userId, user.id))
            .where(eq(sessionSpeaker.sessionId, row.session.id)),
          db
            .select()
            .from(sessionResource)
            .where(eq(sessionResource.sessionId, row.session.id))
            .orderBy(asc(sessionResource.sortOrder)),
          db
            .select({ id: discussion.id, title: discussion.title })
            .from(discussion)
            .where(eq(discussion.sessionId, row.session.id))
            .limit(1),
        ])

        return Response.json({
          ...row.session,
          roomName: row.roomName,
          speakers,
          resources,
          relatedDiscussion: related[0] ?? null,
        })
      },
    },
  },
})

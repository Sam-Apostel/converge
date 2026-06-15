import { createFileRoute } from '@tanstack/react-router'
import { asc, desc, eq, ne } from 'drizzle-orm'

import { db } from '#/db'
import {
  conferenceSession,
  connection,
  profile,
  project,
  room,
  sessionSpeaker,
  user,
} from '#/db/schema'
import {
  loadConferenceSummaries,
  pickActiveConference,
} from '#/lib/queries/active-conference'
import { requireUser } from '#/lib/server-auth'

/**
 * Home dashboard summary for the native app: counts, the next session, people
 * to meet (ranked by project momentum, excluding existing connections) and the
 * trending project. Mirrors `getHomeSummary` but takes the viewer from the
 * request and ignores the conference cookie (the native client doesn't set it).
 */
export const Route = createFileRoute('/api/home')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const me = await requireUser(request)
        const summaries = await loadConferenceSummaries()
        const activeConferenceId = pickActiveConference(summaries, undefined)
        const inConf = activeConferenceId
          ? eq(conferenceSession.conferenceId, activeConferenceId)
          : undefined

        const [peopleCount, projectCount, sessionCount, next, trending, already, candidates] =
          await Promise.all([
            db.$count(profile),
            db.$count(project),
            db.$count(conferenceSession, inConf),
            db
              .select({
                id: conferenceSession.id,
                slug: conferenceSession.slug,
                title: conferenceSession.title,
                startsAt: conferenceSession.startsAt,
                track: conferenceSession.track,
                roomName: room.name,
                speakerName: user.name,
              })
              .from(conferenceSession)
              .leftJoin(room, eq(room.id, conferenceSession.roomId))
              .leftJoin(sessionSpeaker, eq(sessionSpeaker.sessionId, conferenceSession.id))
              .leftJoin(user, eq(user.id, sessionSpeaker.userId))
              .where(inConf)
              .orderBy(asc(conferenceSession.startsAt))
              .limit(1),
            db
              .select({
                name: project.name,
                slug: project.slug,
                tagline: project.tagline,
                trendingScore: project.trendingScore,
                ownerName: user.name,
              })
              .from(project)
              .leftJoin(user, eq(user.id, project.ownerId))
              .orderBy(desc(project.trendingScore))
              .limit(1),
            db
              .select({ contactId: connection.contactId })
              .from(connection)
              .where(eq(connection.userId, me.id)),
            db
              .select({
                id: user.id,
                name: user.name,
                image: user.image,
                headline: profile.headline,
                title: profile.title,
                score: project.trendingScore,
              })
              .from(user)
              .innerJoin(profile, eq(profile.userId, user.id))
              .leftJoin(project, eq(project.ownerId, user.id))
              .where(ne(user.id, me.id))
              .limit(300),
          ])

        const connected = new Set(already.map((r) => r.contactId))
        const byId = new Map<
          string,
          { id: string; name: string; image: string | null; headline: string | null; score: number }
        >()
        for (const c of candidates) {
          if (connected.has(c.id)) continue
          const score = c.score ?? 0
          const prev = byId.get(c.id)
          if (!prev || score > prev.score) {
            byId.set(c.id, {
              id: c.id,
              name: c.name,
              image: c.image,
              headline: c.headline ?? c.title,
              score,
            })
          }
        }
        const peopleToMeet = [...byId.values()]
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map((p) => ({ id: p.id, name: p.name, image: p.image, headline: p.headline, reason: null }))

        return Response.json({
          counts: { people: peopleCount, projects: projectCount, sessions: sessionCount },
          nextSession: next[0] ?? null,
          peopleToMeet,
          trendingProject: trending[0] ?? null,
        })
      },
    },
  },
})

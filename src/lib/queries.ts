import { createServerFn } from '@tanstack/react-start'
import { asc, desc, eq } from 'drizzle-orm'

import { db } from '#/db'
import {
  conferenceSession,
  profile,
  project,
  room,
  sessionSpeaker,
  user,
} from '#/db/schema'
import type { Person } from '#/db/types'

/** Home dashboard: counts, the next session, people to meet, trending project. */
export const getHomeSummary = createServerFn({ method: 'GET' }).handler(
  async () => {
    const [people, projects, sessions, next, ppl, trending] = await Promise.all([
      db.$count(profile),
      db.$count(project),
      db.$count(conferenceSession),
      db
        .select({
          id: conferenceSession.id,
          title: conferenceSession.title,
          startsAt: conferenceSession.startsAt,
          track: conferenceSession.track,
          roomName: room.name,
          speakerId: sessionSpeaker.userId,
          speakerName: user.name,
        })
        .from(conferenceSession)
        .leftJoin(room, eq(room.id, conferenceSession.roomId))
        .leftJoin(
          sessionSpeaker,
          eq(sessionSpeaker.sessionId, conferenceSession.id),
        )
        .leftJoin(user, eq(user.id, sessionSpeaker.userId))
        .orderBy(asc(conferenceSession.startsAt))
        .limit(1),
      db
        .select({ id: user.id, name: user.name })
        .from(user)
        .innerJoin(profile, eq(profile.userId, user.id))
        .limit(6),
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
    ])

    return {
      counts: { people, projects, sessions },
      nextSession: next[0] ?? null,
      peopleToMeet: ppl,
      trendingProject: trending[0] ?? null,
    }
  },
)

export const listPeople = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<Person>> => {
    const rows = await db
      .select({ user, profile })
      .from(user)
      .innerJoin(profile, eq(profile.userId, user.id))
      .orderBy(asc(user.name))
      .limit(200)
    return rows.map((r) => ({
      id: r.user.id,
      name: r.user.name,
      image: r.user.image,
      profile: r.profile,
    }))
  },
)

export type ProjectWithOwner = Awaited<
  ReturnType<typeof listProjects>
>[number]

export const listProjects = createServerFn({ method: 'GET' }).handler(
  async () =>
    db
      .select({
        id: project.id,
        slug: project.slug,
        name: project.name,
        tagline: project.tagline,
        description: project.description,
        category: project.category,
        techStack: project.techStack,
        lookingFor: project.lookingFor,
        trendingScore: project.trendingScore,
        ownerId: project.ownerId,
        ownerName: user.name,
      })
      .from(project)
      .leftJoin(user, eq(user.id, project.ownerId))
      .orderBy(desc(project.trendingScore))
      .limit(100),
)

export const listSessions = createServerFn({ method: 'GET' }).handler(async () =>
  db
    .select({
      id: conferenceSession.id,
      title: conferenceSession.title,
      abstract: conferenceSession.abstract,
      track: conferenceSession.track,
      startsAt: conferenceSession.startsAt,
      endsAt: conferenceSession.endsAt,
      roomName: room.name,
      speakerId: sessionSpeaker.userId,
      speakerName: user.name,
    })
    .from(conferenceSession)
    .leftJoin(room, eq(room.id, conferenceSession.roomId))
    .leftJoin(sessionSpeaker, eq(sessionSpeaker.sessionId, conferenceSession.id))
    .leftJoin(user, eq(user.id, sessionSpeaker.userId))
    .orderBy(asc(conferenceSession.startsAt))
    .limit(200),
)

import { createServerFn } from '@tanstack/react-start'
import { asc, desc, eq } from 'drizzle-orm'

import { db } from '#/db'
import {
  conferenceSession,
  profile,
  project,
  user,
} from '#/db/schema'
import type { Person } from '#/db/types'

/** Counts + the next upcoming session, for the Home dashboard. */
export const getHomeSummary = createServerFn({ method: 'GET' }).handler(
  async () => {
    const [people, projects, sessions, next] = await Promise.all([
      db.$count(user),
      db.$count(project),
      db.$count(conferenceSession),
      db
        .select()
        .from(conferenceSession)
        .orderBy(asc(conferenceSession.startsAt))
        .limit(1),
    ])
    return {
      people,
      projects,
      sessions,
      nextSession: next[0] ?? null,
    }
  },
)

export const listPeople = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<Person>> => {
    const rows = await db
      .select({ user, profile })
      .from(user)
      .leftJoin(profile, eq(profile.userId, user.id))
      .limit(200)
    return rows.map((r) => ({
      id: r.user.id,
      name: r.user.name,
      image: r.user.image,
      profile: r.profile,
    }))
  },
)

export const listProjects = createServerFn({ method: 'GET' }).handler(
  async () =>
    db
      .select()
      .from(project)
      .orderBy(desc(project.trendingScore), desc(project.createdAt))
      .limit(100),
)

export const listSessions = createServerFn({ method: 'GET' }).handler(async () =>
  db
    .select()
    .from(conferenceSession)
    .orderBy(asc(conferenceSession.startsAt))
    .limit(200),
)

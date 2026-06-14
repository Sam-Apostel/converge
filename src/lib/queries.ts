import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, eq, ne } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'

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
import type { Person } from '#/db/types'
import { resolveActiveConferenceId } from '#/lib/queries/active-conference'
import { resolveViewer } from '#/lib/queries/messages'

/** A suggested attendee to meet on the home page. */
export type SuggestedPerson = {
  id: string
  name: string
  image: string | null
  headline: string | null
  /** Why we surfaced them — e.g. "both into RSCs" or null for a fallback pick. */
  reason: string | null
}

/** Count how many entries two (possibly null) arrays share. */
function sharedCount(a: Array<string> | null, b: Array<string> | null): number {
  if (!a?.length || !b?.length) return 0
  const set = new Set(a)
  return b.filter((x) => set.has(x)).length
}

/**
 * People to meet: attendees the viewer hasn't connected with yet, ranked by
 * overlapping interested-topics / intents, falling back to project momentum so
 * the slot is never empty. (Shared-moment ranking lives in the MCP layer.)
 */
async function suggestPeopleToMeet(limit = 5): Promise<Array<SuggestedPerson>> {
  const me = await resolveViewer()

  const [mine] = await db
    .select()
    .from(profile)
    .where(eq(profile.userId, me))
    .limit(1)

  const already = new Set(
    (
      await db
        .select({ contactId: connection.contactId })
        .from(connection)
        .where(eq(connection.userId, me))
    ).map((r) => r.contactId),
  )

  const candidates = await db
    .select({ user, profile, ownerScore: project.trendingScore })
    .from(user)
    .innerJoin(profile, eq(profile.userId, user.id))
    .leftJoin(project, eq(project.ownerId, user.id))
    .where(ne(user.id, me))
    .limit(300)

  // Dedupe (a person may own several projects), keeping their best project score.
  const byId = new Map<string, (typeof candidates)[number]>()
  for (const c of candidates) {
    const prev = byId.get(c.user.id)
    if (!prev || (c.ownerScore ?? 0) > (prev.ownerScore ?? 0)) {
      byId.set(c.user.id, c)
    }
  }

  const scored = [...byId.values()]
    .filter((c) => !already.has(c.user.id))
    .map((c) => {
      const topics = sharedCount(
        mine?.interestedTopics ?? null,
        c.profile.interestedTopics,
      )
      const intents = sharedCount(mine?.intents ?? null, c.profile.intents)
      const sharedTopic = (mine?.interestedTopics ?? []).find((t) =>
        (c.profile.interestedTopics ?? []).includes(t),
      )
      return {
        affinity: topics + intents,
        momentum: c.ownerScore ?? 0,
        person: {
          id: c.user.id,
          name: c.user.name,
          image: c.user.image,
          headline: c.profile.headline ?? c.profile.title,
          reason: sharedTopic ? `both into ${sharedTopic}` : null,
        } satisfies SuggestedPerson,
      }
    })
    .sort((a, b) => b.affinity - a.affinity || b.momentum - a.momentum)
    .slice(0, limit)

  return scored.map((s) => s.person)
}

/** Home dashboard: counts, the next session, people to meet, trending project. */
export const getHomeSummary = createServerFn({ method: 'GET' }).handler(
  async () => {
    // Sessions and the "next up" card are scoped to the active conference; the
    // people/project network spans the whole summit.
    const activeConferenceId = await resolveActiveConferenceId()
    const inConference = activeConferenceId
      ? eq(conferenceSession.conferenceId, activeConferenceId)
      : undefined

    const [people, projects, sessions, next, peopleToMeet, trending] =
      await Promise.all([
        db.$count(profile),
        db.$count(project),
        db.$count(conferenceSession, inConference),
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
          .where(inConference)
          .orderBy(asc(conferenceSession.startsAt))
          .limit(1),
        suggestPeopleToMeet(),
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
      peopleToMeet,
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

export type ProjectWithOwner = Awaited<ReturnType<typeof listProjects>>[number]

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
        screenshots: project.screenshots,
        trendingScore: project.trendingScore,
        ownerId: project.ownerId,
        ownerName: user.name,
      })
      .from(project)
      .leftJoin(user, eq(user.id, project.ownerId))
      .orderBy(desc(project.trendingScore))
      .limit(100),
)

/**
 * Sessions for the schedule. Scoped to the active conference by default; pass
 * an explicit `conferenceId` (e.g. from a conference landing page) to override,
 * or `null` to list across every conference.
 */
export const listSessions = createServerFn({ method: 'GET' })
  .validator((conferenceId?: string | null) => conferenceId)
  .handler(async ({ data }) => {
    const conferenceId =
      data === undefined ? await resolveActiveConferenceId() : data
    const filters: Array<SQL> = []
    if (conferenceId) {
      filters.push(eq(conferenceSession.conferenceId, conferenceId))
    }

    return db
      .select({
        id: conferenceSession.id,
        slug: conferenceSession.slug,
        conferenceId: conferenceSession.conferenceId,
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
      .leftJoin(
        sessionSpeaker,
        eq(sessionSpeaker.sessionId, conferenceSession.id),
      )
      .leftJoin(user, eq(user.id, sessionSpeaker.userId))
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(asc(conferenceSession.startsAt))
      .limit(200)
  })

/**
 * Concierge tools (silo 7) — thin, **read-only** wrappers over Converge data,
 * scoped to the authenticated user.
 *
 * These intentionally do NOT go through the OAuth-protected `/mcp` server; they
 * talk to `#/db` directly. The MCP modules in `src/mcp/tools/*` are the
 * reference for the query shapes. Keep everything here read-only — no
 * destructive actions.
 *
 * Server-only (imports `#/db`).
 */
import { toolDefinition } from '@tanstack/ai'
import type { ServerTool } from '@tanstack/ai'
import { and, asc, eq, gte, ilike, inArray, lte, or } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '#/db'
import {
  conferenceSession,
  moment,
  note,
  profile,
  project,
  sessionSpeaker,
  user,
} from '#/db/schema'

/* ------------------------------------------------------------------ */
/* Shared result shapes (compact + UI-friendly)                        */
/* ------------------------------------------------------------------ */

type PersonResult = {
  id: string
  name: string
  image: string | null
  headline: string | null
  company: string | null
  currentFocus: string | null
  interestedTopics: Array<string> | null
}

type SessionResult = {
  id: string
  title: string
  track: string | null
  abstract: string | null
  startsAt: string | null
  endsAt: string | null
}

type ProjectResult = {
  id: string
  slug: string
  name: string
  tagline: string | null
  category: string | null
  techStack: Array<string> | null
  lookingFor: Array<string> | null
}

const toSession = (
  s: typeof conferenceSession.$inferSelect,
): SessionResult => ({
  id: s.id,
  title: s.title,
  track: s.track,
  abstract: s.abstract,
  startsAt: s.startsAt ? s.startsAt.toISOString() : null,
  endsAt: s.endsAt ? s.endsAt.toISOString() : null,
})

/* ------------------------------------------------------------------ */
/* Tool definitions                                                    */
/* ------------------------------------------------------------------ */

const searchPeopleDef = toolDefinition({
  name: 'search_people',
  description:
    'Find attendees by name, headline, company, current focus or bio. Returns up to 24 people.',
  inputSchema: z.object({
    query: z
      .string()
      .default('')
      .meta({ description: 'Free-text search across name and profile fields' }),
  }),
})

const listSessionsDef = toolDefinition({
  name: 'list_sessions',
  description:
    'List conference sessions (talks), ordered by start time. Optionally filter to one conference.',
  inputSchema: z.object({
    conferenceId: z
      .string()
      .optional()
      .meta({ description: 'Restrict to a single conference id' }),
  }),
})

const getScheduleDef = toolDefinition({
  name: 'get_schedule',
  description:
    'Get the schedule, optionally filtered by track and/or a time window (ISO timestamps).',
  inputSchema: z.object({
    conferenceId: z.string().optional().meta({ description: 'Conference id' }),
    track: z
      .string()
      .optional()
      .meta({ description: 'Filter to a single track' }),
    startsAfter: z
      .string()
      .optional()
      .meta({
        description: 'Only sessions starting at/after this ISO timestamp',
      }),
    startsBefore: z
      .string()
      .optional()
      .meta({
        description: 'Only sessions starting at/before this ISO timestamp',
      }),
  }),
})

const listProjectsDef = toolDefinition({
  name: 'list_projects',
  description:
    'List projects people are building, newest first. Optionally filter by category.',
  inputSchema: z.object({
    category: z
      .string()
      .optional()
      .meta({
        description:
          'startup | side-project | research | open-source | product',
      }),
  }),
})

const getProfileDef = toolDefinition({
  name: 'get_profile',
  description: "Get a person's full Converge profile by their user id.",
  inputSchema: z.object({
    userId: z.string().meta({ description: 'The user id to look up' }),
  }),
})

const myScheduleDef = toolDefinition({
  name: 'my_schedule',
  description:
    "The current user's sessions — talks they speak at, bookmarked a moment in, or took a note on — ordered by start time.",
  inputSchema: z.object({}),
})

/* ------------------------------------------------------------------ */
/* Server implementations                                              */
/* ------------------------------------------------------------------ */

async function searchPeople(query: string): Promise<Array<PersonResult>> {
  const like = `%${query}%`
  const rows = await db
    .select({ user, profile })
    .from(user)
    .leftJoin(profile, eq(profile.userId, user.id))
    .where(
      query
        ? or(
            ilike(user.name, like),
            ilike(profile.headline, like),
            ilike(profile.company, like),
            ilike(profile.currentFocus, like),
            ilike(profile.bio, like),
          )
        : undefined,
    )
    .limit(24)

  return rows.map((r) => ({
    id: r.user.id,
    name: r.user.name,
    image: r.user.image,
    headline: r.profile?.headline ?? null,
    company: r.profile?.company ?? null,
    currentFocus: r.profile?.currentFocus ?? null,
    interestedTopics: r.profile?.interestedTopics ?? null,
  }))
}

/**
 * Build the concierge's read-only tool set, scoped to `userId`. Pass the result
 * straight to `chat({ tools })`.
 */
export function buildTools(userId: string): Array<ServerTool> {
  const searchPeopleTool = searchPeopleDef.server(async ({ query }) => ({
    people: await searchPeople(query ?? ''),
  }))

  const listSessionsTool = listSessionsDef.server(async ({ conferenceId }) => {
    const rows = await db
      .select()
      .from(conferenceSession)
      .where(
        conferenceId
          ? eq(conferenceSession.conferenceId, conferenceId)
          : undefined,
      )
      .orderBy(asc(conferenceSession.startsAt))
      .limit(200)
    return { sessions: rows.map(toSession) }
  })

  const getScheduleTool = getScheduleDef.server(
    async ({ conferenceId, track, startsAfter, startsBefore }) => {
      const filters = []
      if (conferenceId)
        filters.push(eq(conferenceSession.conferenceId, conferenceId))
      if (track) filters.push(eq(conferenceSession.track, track))
      if (startsAfter)
        filters.push(gte(conferenceSession.startsAt, new Date(startsAfter)))
      if (startsBefore)
        filters.push(lte(conferenceSession.startsAt, new Date(startsBefore)))

      const rows = await db
        .select()
        .from(conferenceSession)
        .where(filters.length ? and(...filters) : undefined)
        .orderBy(asc(conferenceSession.startsAt))
        .limit(200)
      return { sessions: rows.map(toSession) }
    },
  )

  const listProjectsTool = listProjectsDef.server(async ({ category }) => {
    const rows = await db
      .select()
      .from(project)
      .where(category ? eq(project.category, category) : undefined)
      .orderBy(asc(project.name))
      .limit(100)
    return {
      projects: rows.map(
        (p): ProjectResult => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          tagline: p.tagline,
          category: p.category,
          techStack: p.techStack,
          lookingFor: p.lookingFor,
        }),
      ),
    }
  })

  const getProfileTool = getProfileDef.server(async ({ userId: targetId }) => {
    const rows = await db
      .select({ user, profile })
      .from(user)
      .leftJoin(profile, eq(profile.userId, user.id))
      .where(eq(user.id, targetId))
      .limit(1)
    if (rows.length === 0) return { person: null }
    const row = rows[0]
    return {
      person: {
        id: row.user.id,
        name: row.user.name,
        image: row.user.image,
        headline: row.profile?.headline ?? null,
        company: row.profile?.company ?? null,
        title: row.profile?.title ?? null,
        bio: row.profile?.bio ?? null,
        location: row.profile?.location ?? null,
        intents: row.profile?.intents ?? null,
        currentFocus: row.profile?.currentFocus ?? null,
        interestedTopics: row.profile?.interestedTopics ?? null,
      },
    }
  })

  const myScheduleTool = myScheduleDef.server(async () => {
    const [bookmarked, noted, speaking] = await Promise.all([
      db
        .selectDistinct({ sessionId: moment.sessionId })
        .from(moment)
        .where(eq(moment.userId, userId)),
      db
        .selectDistinct({ sessionId: note.sessionId })
        .from(note)
        .where(eq(note.userId, userId)),
      db
        .selectDistinct({ sessionId: sessionSpeaker.sessionId })
        .from(sessionSpeaker)
        .where(eq(sessionSpeaker.userId, userId)),
    ])

    const sessionIds = [
      ...new Set(
        [...bookmarked, ...noted, ...speaking]
          .map((r) => r.sessionId)
          .filter((id): id is string => Boolean(id)),
      ),
    ]
    if (sessionIds.length === 0) return { sessions: [] as Array<SessionResult> }

    const rows = await db
      .select()
      .from(conferenceSession)
      .where(inArray(conferenceSession.id, sessionIds))
      .orderBy(asc(conferenceSession.startsAt))
    return { sessions: rows.map(toSession) }
  })

  return [
    searchPeopleTool,
    listSessionsTool,
    getScheduleTool,
    listProjectsTool,
    getProfileTool,
    myScheduleTool,
  ]
}

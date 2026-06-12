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
import { and, asc, desc, eq, gte, ilike, inArray, lte, or } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '#/db'
import {
  answer,
  conferenceSession,
  moment,
  note,
  profile,
  project,
  question,
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

const getTrendingProjectsDef = toolDefinition({
  name: 'get_trending_projects',
  description:
    'Top projects ranked by trending score. Use this to find what people are most excited about at the conference.',
  inputSchema: z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .default(10)
      .meta({ description: 'Maximum number of projects to return' }),
  }),
})

const getSessionSummaryDef = toolDefinition({
  name: 'get_session_summary',
  description:
    'Get full details for a session (talk), including abstract, speakers, and the Q&A from the audience.',
  inputSchema: z.object({
    sessionId: z.string().meta({ description: 'Session id to look up' }),
  }),
})

const getMyMomentsDef = toolDefinition({
  name: 'get_my_moments',
  description:
    "Get the current user's bookmarked moments — key highlights they tapped to save during talks.",
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

  const getTrendingProjectsTool = getTrendingProjectsDef.server(
    async ({ limit }) => {
      const rows = await db
        .select()
        .from(project)
        .orderBy(desc(project.trendingScore))
        .limit(limit ?? 10)
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
    },
  )

  const getSessionSummaryTool = getSessionSummaryDef.server(
    async ({ sessionId }) => {
      const [session] = await db
        .select()
        .from(conferenceSession)
        .where(eq(conferenceSession.id, sessionId))
        .limit(1)
      if (!session) return { session: null }

      const speakers = await db
        .select({ id: user.id, name: user.name, image: user.image })
        .from(sessionSpeaker)
        .innerJoin(user, eq(user.id, sessionSpeaker.userId))
        .where(eq(sessionSpeaker.sessionId, sessionId))

      const questions = await db
        .select()
        .from(question)
        .where(eq(question.sessionId, sessionId))
        .orderBy(desc(question.upvotes), asc(question.createdAt))
        .limit(20)

      const questionIds = questions.map((q) => q.id)
      const answers =
        questionIds.length > 0
          ? await db
              .select()
              .from(answer)
              .where(inArray(answer.questionId, questionIds))
          : []

      const answersByQuestion = new Map<
        string,
        Array<(typeof answers)[number]>
      >()
      for (const a of answers) {
        const list = answersByQuestion.get(a.questionId) ?? []
        list.push(a)
        answersByQuestion.set(a.questionId, list)
      }

      return {
        session: toSession(session),
        speakers,
        qa: questions.map((q) => ({
          id: q.id,
          body: q.body,
          status: q.status,
          upvotes: q.upvotes,
          answers: (answersByQuestion.get(q.id) ?? []).map((a) => ({
            body: a.body,
            fromSpeaker: a.fromSpeaker,
          })),
        })),
      }
    },
  )

  const getMyMomentsTool = getMyMomentsDef.server(async () => {
    const rows = await db
      .select()
      .from(moment)
      .where(eq(moment.userId, userId))
      .orderBy(desc(moment.createdAt))
      .limit(50)
    return { moments: rows }
  })

  return [
    searchPeopleTool,
    listSessionsTool,
    getScheduleTool,
    listProjectsTool,
    getProfileTool,
    myScheduleTool,
    getTrendingProjectsTool,
    getSessionSummaryTool,
    getMyMomentsTool,
  ]
}

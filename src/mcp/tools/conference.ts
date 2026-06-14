import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { and, asc, desc, eq, gte, lte, ne } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '#/db'
import {
  conference,
  conferenceSession,
  moment,
  question,
  room,
  sessionResource as sessionResourceTable,
  sessionSpeaker,
  user,
} from '#/db/schema'
import { sessionResource } from '#/mcp/apps'

import { text } from './util'

/** Load a session together with its room and speakers. */
async function loadSession(sessionId: string) {
  const [session] = await db
    .select()
    .from(conferenceSession)
    .where(eq(conferenceSession.id, sessionId))
    .limit(1)
  if (!session) return null

  const [sessionRoom] = session.roomId
    ? await db.select().from(room).where(eq(room.id, session.roomId)).limit(1)
    : [null]

  const speakers = await db
    .select({ id: user.id, name: user.name, image: user.image })
    .from(sessionSpeaker)
    .innerJoin(user, eq(user.id, sessionSpeaker.userId))
    .where(eq(sessionSpeaker.sessionId, sessionId))

  return { session, room: sessionRoom ?? null, speakers }
}

/**
 * Conference surface: the public conference graph — talks, rooms, schedule and
 * speakers. Mostly user-agnostic; `get_moment_matches` is the one user-scoped
 * tool, surfacing who the calling user overlaps with inside a talk.
 */
export function register(server: McpServer, userId: string) {
  server.registerTool(
    'list_conferences',
    {
      title: 'List conferences',
      description: 'List conferences available on Converge.',
      inputSchema: {},
    },
    async () => text(await db.select().from(conference).limit(50)),
  )

  server.registerTool(
    'list_sessions',
    {
      title: 'List sessions',
      description:
        'List sessions (talks) for a conference, ordered by start time.',
      inputSchema: { conferenceId: z.string().describe('Conference id') },
    },
    async ({ conferenceId }) =>
      text(
        await db
          .select()
          .from(conferenceSession)
          .where(eq(conferenceSession.conferenceId, conferenceId))
          .orderBy(asc(conferenceSession.startsAt))
          .limit(200),
      ),
  )

  server.registerTool(
    'get_session',
    {
      title: 'Get session',
      description: 'Get a single session (talk) with its room and speakers.',
      inputSchema: { sessionId: z.string().describe('Session id') },
    },
    async ({ sessionId }) => text(await loadSession(sessionId)),
  )

  server.registerTool(
    'get_session_resources',
    {
      title: 'Get session resources',
      description:
        'List the links, slide decks and references a speaker shared for a session.',
      inputSchema: { sessionId: z.string().describe('Session id') },
    },
    async ({ sessionId }) =>
      text(
        await db
          .select({
            id: sessionResourceTable.id,
            label: sessionResourceTable.label,
            url: sessionResourceTable.url,
          })
          .from(sessionResourceTable)
          .where(eq(sessionResourceTable.sessionId, sessionId))
          .orderBy(sessionResourceTable.sortOrder),
      ),
  )

  server.registerTool(
    'list_rooms',
    {
      title: 'List rooms',
      description: 'List the rooms (venue spaces) for a conference.',
      inputSchema: { conferenceId: z.string().describe('Conference id') },
    },
    async ({ conferenceId }) =>
      text(
        await db.select().from(room).where(eq(room.conferenceId, conferenceId)),
      ),
  )

  server.registerTool(
    'get_schedule',
    {
      title: 'Get schedule',
      description:
        'Get a conference schedule, optionally filtered by track and/or a time window (ISO timestamps).',
      inputSchema: {
        conferenceId: z.string().describe('Conference id'),
        track: z.string().optional().describe('Filter to a single track'),
        startsAfter: z
          .string()
          .optional()
          .describe('Only sessions starting at/after this ISO timestamp'),
        startsBefore: z
          .string()
          .optional()
          .describe('Only sessions starting at/before this ISO timestamp'),
      },
    },
    async ({ conferenceId, track, startsAfter, startsBefore }) => {
      const filters = [eq(conferenceSession.conferenceId, conferenceId)]
      if (track) filters.push(eq(conferenceSession.track, track))
      if (startsAfter)
        filters.push(gte(conferenceSession.startsAt, new Date(startsAfter)))
      if (startsBefore)
        filters.push(lte(conferenceSession.startsAt, new Date(startsBefore)))

      return text(
        await db
          .select()
          .from(conferenceSession)
          .where(and(...filters))
          .orderBy(asc(conferenceSession.startsAt))
          .limit(200),
      )
    },
  )

  server.registerTool(
    'list_speakers',
    {
      title: 'List speakers',
      description: 'List the distinct speakers giving talks at a conference.',
      inputSchema: { conferenceId: z.string().describe('Conference id') },
    },
    async ({ conferenceId }) => {
      const rows = await db
        .selectDistinct({ id: user.id, name: user.name, image: user.image })
        .from(sessionSpeaker)
        .innerJoin(
          conferenceSession,
          eq(conferenceSession.id, sessionSpeaker.sessionId),
        )
        .innerJoin(user, eq(user.id, sessionSpeaker.userId))
        .where(eq(conferenceSession.conferenceId, conferenceId))
      return text(rows)
    },
  )

  server.registerTool(
    'get_session_summary',
    {
      title: 'Get session summary',
      description:
        'Get full details for a session (talk) — abstract, speakers, and the Q&A thread from the audience.',
      inputSchema: { sessionId: z.string().describe('Session id') },
    },
    async ({ sessionId }) => {
      const loaded = await loadSession(sessionId)
      if (!loaded) return text(null)

      const questions = await db
        .select()
        .from(question)
        .where(eq(question.sessionId, sessionId))
        .orderBy(desc(question.upvotes), asc(question.createdAt))
        .limit(20)

      return text({
        session: loaded.session,
        room: loaded.room,
        speakers: loaded.speakers,
        questionCount: questions.length,
        questions: questions.map((q) => ({
          id: q.id,
          body: q.body,
          status: q.status,
          upvotes: q.upvotes,
        })),
      })
    },
  )

  server.registerTool(
    'get_moment_matches',
    {
      title: 'Get moment matches',
      description:
        'For a talk, find the other attendees who bookmarked the same passages as the calling user (within a time window of each of their moments), sorted by number of shared moments descending. Use this to say e.g. "you and @alex both kept the same part of the talk".',
      inputSchema: {
        sessionId: z.string().describe('Session id'),
        windowMs: z
          .number()
          .int()
          .min(0)
          .default(30_000)
          .describe('How close two moments must be to count as shared (ms)'),
      },
    },
    async ({ sessionId, windowMs }) => {
      // My moments in this talk, and everyone else's.
      const mine = await db
        .select({ timestampMs: moment.timestampMs })
        .from(moment)
        .where(and(eq(moment.sessionId, sessionId), eq(moment.userId, userId)))

      if (mine.length === 0) return text([])

      const others = await db
        .select({
          userId: moment.userId,
          timestampMs: moment.timestampMs,
          name: user.name,
          image: user.image,
        })
        .from(moment)
        .innerJoin(user, eq(user.id, moment.userId))
        .where(and(eq(moment.sessionId, sessionId), ne(moment.userId, userId)))

      // Count, per attendee, how many of their moments land near one of mine.
      const byUser = new Map<
        string,
        {
          userId: string
          name: string
          image: string | null
          sharedMoments: number
        }
      >()
      for (const o of others) {
        const near = mine.some(
          (m) => Math.abs(m.timestampMs - o.timestampMs) <= windowMs,
        )
        if (!near) continue
        const entry = byUser.get(o.userId) ?? {
          userId: o.userId,
          name: o.name,
          image: o.image,
          sharedMoments: 0,
        }
        entry.sharedMoments += 1
        byUser.set(o.userId, entry)
      }

      const matches = [...byUser.values()].sort(
        (a, b) => b.sharedMoments - a.sharedMoments,
      )
      return text(matches)
    },
  )

  server.registerTool(
    'session_app',
    {
      title: 'Session (interactive)',
      description:
        'Render a session with its bookmarked moments and Q&A as an interactive MCP Apps surface. Same data as get_session.',
      inputSchema: { sessionId: z.string().describe('Session id') },
    },
    async ({ sessionId }) => {
      const loaded = await loadSession(sessionId)
      if (!loaded) return text(null)

      const moments = await db
        .select()
        .from(moment)
        .where(eq(moment.sessionId, sessionId))
        .orderBy(asc(moment.timestampMs))
        .limit(100)

      const questions = await db
        .select()
        .from(question)
        .where(eq(question.sessionId, sessionId))
        .orderBy(asc(question.createdAt))
        .limit(100)

      return {
        content: [
          sessionResource(loaded.session, loaded.speakers, moments, questions),
          {
            type: 'text' as const,
            text: JSON.stringify({ ...loaded, moments, questions }),
          },
        ],
      }
    },
  )
}

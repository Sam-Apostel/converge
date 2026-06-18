import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { and, eq, like } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '#/db'
import {
  conference,
  conferenceSession,
  room,
  sessionResource,
  sessionSpeaker,
  user,
} from '#/db/schema'

import { text } from './util'

/** Slugify a free-text name into a url-safe token. */
const slugify = (input: string) =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

/**
 * Pick a slug for `name` that no row in `table` already holds, suffixing `-2`,
 * `-3`, … on collision. Works for any table with a unique `slug` column.
 */
async function uniqueSlug(
  table: typeof conference | typeof conferenceSession,
  name: string,
): Promise<string> {
  const base = slugify(name) || 'item'
  const taken = new Set(
    (
      await db
        .select({ slug: table.slug })
        .from(table)
        .where(like(table.slug, `${base}%`))
    ).map((r) => r.slug),
  )
  if (!taken.has(base)) return base
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`
}

/** Coerce an optional ISO timestamp string to a Date (or null to clear it). */
const toDate = (iso: string | null | undefined) =>
  iso === undefined ? undefined : iso === null ? null : new Date(iso)

/**
 * Admin surface: write access to the conference graph — conferences, rooms,
 * the schedule (sessions), and a session's resources and speakers.
 *
 * Registered only for global super-admins (`user.isAdmin`), so it is absent from
 * the tool list of ordinary attendees. Authorization is therefore the caller's
 * admin flag, checked once at registration in `buildServer`; the tools assume it.
 */
export function register(server: McpServer, _userId: string) {
  /* ---- Conference -------------------------------------------------- */

  server.registerTool(
    'create_conference',
    {
      title: 'Create conference (admin)',
      description:
        'Create a conference. Returns the new conference id and slug.',
      inputSchema: {
        name: z.string().describe('Conference name'),
        tagline: z.string().optional(),
        description: z.string().optional(),
        timezone: z.string().optional().describe('IANA tz, defaults to UTC'),
        venueName: z.string().optional(),
        startsAt: z.string().optional().describe('ISO timestamp'),
        endsAt: z.string().optional().describe('ISO timestamp'),
      },
    },
    async ({
      name,
      tagline,
      description,
      timezone,
      venueName,
      startsAt,
      endsAt,
    }) => {
      const trimmed = name.trim()
      if (!trimmed) throw new Error('Conference name is required')
      const [row] = await db
        .insert(conference)
        .values({
          slug: await uniqueSlug(conference, trimmed),
          name: trimmed,
          tagline: tagline?.trim() || null,
          description: description?.trim() || null,
          ...(timezone ? { timezone } : {}),
          venueName: venueName?.trim() || null,
          startsAt: toDate(startsAt) ?? null,
          endsAt: toDate(endsAt) ?? null,
        })
        .returning()
      return text(row)
    },
  )

  server.registerTool(
    'update_conference',
    {
      title: 'Update conference (admin)',
      description:
        'Update a conference. Only the fields you pass are changed; pass null to clear a nullable field.',
      inputSchema: {
        conferenceId: z.string(),
        name: z.string().optional(),
        tagline: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        timezone: z.string().optional(),
        venueName: z.string().nullable().optional(),
        startsAt: z.string().nullable().optional().describe('ISO timestamp'),
        endsAt: z.string().nullable().optional().describe('ISO timestamp'),
      },
    },
    async ({ conferenceId, startsAt, endsAt, ...rest }) => {
      const patch = {
        ...rest,
        ...(startsAt !== undefined ? { startsAt: toDate(startsAt) } : {}),
        ...(endsAt !== undefined ? { endsAt: toDate(endsAt) } : {}),
      }
      const [row] = await db
        .update(conference)
        .set(patch)
        .where(eq(conference.id, conferenceId))
        .returning()
      if (!row) throw new Error('Conference not found')
      return text(row)
    },
  )

  /* ---- Rooms ------------------------------------------------------- */

  server.registerTool(
    'create_room',
    {
      title: 'Create room (admin)',
      description: 'Add a room (venue space) to a conference.',
      inputSchema: {
        conferenceId: z.string(),
        name: z.string(),
        floor: z.string().optional(),
        capacity: z.number().int().positive().optional(),
      },
    },
    async ({ conferenceId, name, floor, capacity }) => {
      const [row] = await db
        .insert(room)
        .values({ conferenceId, name: name.trim(), floor, capacity })
        .returning()
      return text(row)
    },
  )

  server.registerTool(
    'delete_room',
    {
      title: 'Delete room (admin)',
      description:
        'Delete a room. Sessions in it keep their slot but lose their room (set to null).',
      inputSchema: { roomId: z.string() },
    },
    async ({ roomId }) => {
      const [row] = await db
        .delete(room)
        .where(eq(room.id, roomId))
        .returning({ id: room.id })
      if (!row) throw new Error('Room not found')
      return text({ deleted: row.id })
    },
  )

  /* ---- Sessions (the schedule) ------------------------------------- */

  server.registerTool(
    'create_session',
    {
      title: 'Create session (admin)',
      description:
        'Add a session (talk) to a conference schedule. Times are ISO timestamps.',
      inputSchema: {
        conferenceId: z.string(),
        title: z.string(),
        abstract: z.string().optional(),
        track: z.string().optional(),
        roomId: z.string().optional(),
        startsAt: z.string().optional().describe('ISO timestamp'),
        endsAt: z.string().optional().describe('ISO timestamp'),
        livestreamUrl: z.string().optional(),
      },
    },
    async ({
      conferenceId,
      title,
      abstract,
      track,
      roomId,
      startsAt,
      endsAt,
      livestreamUrl,
    }) => {
      const trimmed = title.trim()
      if (!trimmed) throw new Error('Session title is required')
      const [row] = await db
        .insert(conferenceSession)
        .values({
          slug: await uniqueSlug(conferenceSession, trimmed),
          conferenceId,
          title: trimmed,
          abstract: abstract?.trim() || null,
          track: track?.trim() || null,
          roomId: roomId || null,
          startsAt: toDate(startsAt) ?? null,
          endsAt: toDate(endsAt) ?? null,
          livestreamUrl: livestreamUrl || null,
        })
        .returning()
      return text(row)
    },
  )

  server.registerTool(
    'update_session',
    {
      title: 'Update session (admin)',
      description:
        'Update a session. Only the fields you pass are changed; pass null to clear a nullable field.',
      inputSchema: {
        sessionId: z.string(),
        title: z.string().optional(),
        abstract: z.string().nullable().optional(),
        track: z.string().nullable().optional(),
        roomId: z.string().nullable().optional(),
        startsAt: z.string().nullable().optional().describe('ISO timestamp'),
        endsAt: z.string().nullable().optional().describe('ISO timestamp'),
        livestreamUrl: z.string().nullable().optional(),
      },
    },
    async ({ sessionId, startsAt, endsAt, ...rest }) => {
      const patch = {
        ...rest,
        ...(startsAt !== undefined ? { startsAt: toDate(startsAt) } : {}),
        ...(endsAt !== undefined ? { endsAt: toDate(endsAt) } : {}),
      }
      const [row] = await db
        .update(conferenceSession)
        .set(patch)
        .where(eq(conferenceSession.id, sessionId))
        .returning()
      if (!row) throw new Error('Session not found')
      return text(row)
    },
  )

  server.registerTool(
    'delete_session',
    {
      title: 'Delete session (admin)',
      description:
        'Delete a session and everything hanging off it (moments, questions, resources, speakers).',
      inputSchema: { sessionId: z.string() },
    },
    async ({ sessionId }) => {
      const [row] = await db
        .delete(conferenceSession)
        .where(eq(conferenceSession.id, sessionId))
        .returning({ id: conferenceSession.id })
      if (!row) throw new Error('Session not found')
      return text({ deleted: row.id })
    },
  )

  /* ---- Session resources ------------------------------------------ */

  server.registerTool(
    'add_session_resource',
    {
      title: 'Add session resource (admin)',
      description:
        'Attach a link, slide deck or reference to a session, shown on its page.',
      inputSchema: {
        sessionId: z.string(),
        label: z.string(),
        url: z.string(),
        sortOrder: z.number().int().optional(),
      },
    },
    async ({ sessionId, label, url, sortOrder }) => {
      const [row] = await db
        .insert(sessionResource)
        .values({
          sessionId,
          label: label.trim(),
          url: url.trim(),
          ...(sortOrder !== undefined ? { sortOrder } : {}),
        })
        .returning()
      return text(row)
    },
  )

  server.registerTool(
    'remove_session_resource',
    {
      title: 'Remove session resource (admin)',
      description: 'Remove a previously attached session resource.',
      inputSchema: { resourceId: z.string() },
    },
    async ({ resourceId }) => {
      const [row] = await db
        .delete(sessionResource)
        .where(eq(sessionResource.id, resourceId))
        .returning({ id: sessionResource.id })
      if (!row) throw new Error('Resource not found')
      return text({ deleted: row.id })
    },
  )

  /* ---- Session speakers -------------------------------------------- */

  server.registerTool(
    'add_session_speaker',
    {
      title: 'Add session speaker (admin)',
      description: 'Assign a user as a speaker on a session. Idempotent.',
      inputSchema: { sessionId: z.string(), userId: z.string() },
    },
    async ({ sessionId, userId }) => {
      const [exists] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1)
      if (!exists) throw new Error('User not found')
      const [row] = await db
        .insert(sessionSpeaker)
        .values({ sessionId, userId })
        .onConflictDoNothing()
        .returning()
      return text(row ?? { sessionId, userId, alreadyAssigned: true })
    },
  )

  server.registerTool(
    'remove_session_speaker',
    {
      title: 'Remove session speaker (admin)',
      description: 'Unassign a speaker from a session.',
      inputSchema: { sessionId: z.string(), userId: z.string() },
    },
    async ({ sessionId, userId }) => {
      const [row] = await db
        .delete(sessionSpeaker)
        .where(
          and(
            eq(sessionSpeaker.sessionId, sessionId),
            eq(sessionSpeaker.userId, userId),
          ),
        )
        .returning({ id: sessionSpeaker.id })
      if (!row) throw new Error('Speaker assignment not found')
      return text({ deleted: row.id })
    },
  )
}

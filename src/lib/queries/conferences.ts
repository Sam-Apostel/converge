/**
 * Conference selection — the app shows one conference at a time, but the data
 * model holds several co-located events (e.g. JSNation + React Summit). The
 * "active" conference is persisted in a cookie so every scoped query
 * (`listSessions`, the home summary) and the header switcher agree on it.
 *
 * The cookie-touching helpers live in the server-only `active-conference.ts`;
 * this module only exposes the client-callable server functions + the type.
 */
import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie } from '@tanstack/react-start/server'
import { eq, like } from 'drizzle-orm'

import { db } from '#/db'
import { conference, conferenceMember } from '#/db/schema'
import {
  CONFERENCE_COOKIE,
  loadConferenceSummaries,
  pickActiveConference,
} from '#/lib/queries/active-conference'
import type { ConferenceSummary } from '#/lib/queries/active-conference'
import { resolveViewer } from '#/lib/queries/messages'

export type { ConferenceSummary }

export const CONFERENCE_ROLES = [
  'attendee',
  'speaker',
  'organizer',
  'sponsor',
] as const
export type ConferenceRole = (typeof CONFERENCE_ROLES)[number]

const COOKIE_OPTS = {
  path: '/',
  httpOnly: false,
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 180,
}

const slugify = (input: string) =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

async function uniqueConferenceSlug(name: string): Promise<string> {
  const base = slugify(name) || 'conference'
  const taken = new Set(
    (
      await db
        .select({ slug: conference.slug })
        .from(conference)
        .where(like(conference.slug, `${base}%`))
    ).map((r) => r.slug),
  )
  if (!taken.has(base)) return base
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`
}

export type ConferenceContext = {
  conferences: Array<ConferenceSummary>
  /** The active conference id, or null when none are seeded. */
  activeId: string | null
}

/** The conferences list plus the active id — drives the header switcher. */
export const getConferenceContext = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ConferenceContext> => {
    const conferences = await loadConferenceSummaries()
    return {
      conferences,
      activeId: pickActiveConference(conferences, getCookie(CONFERENCE_COOKIE)),
    }
  },
)

/** Switch the active conference. Validates the id, persists it, echoes context. */
export const setActiveConference = createServerFn({ method: 'POST' })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<ConferenceContext> => {
    const conferences = await loadConferenceSummaries()
    const target = conferences.find((c) => c.id === id || c.slug === id)
    if (target) {
      setCookie(CONFERENCE_COOKIE, target.id, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 180,
      })
    }
    return {
      conferences,
      activeId:
        target?.id ??
        pickActiveConference(conferences, getCookie(CONFERENCE_COOKIE)),
    }
  })

/** The viewer's conference memberships, as a `conferenceId → role` list. */
export const listMyConferenceRoles = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<{ conferenceId: string; role: string }>> => {
    const userId = await resolveViewer()
    return db
      .select({
        conferenceId: conferenceMember.conferenceId,
        role: conferenceMember.role,
      })
      .from(conferenceMember)
      .where(eq(conferenceMember.userId, userId))
  },
)

/** Create a conference and enroll the creator as its organizer; make it active. */
export const createConference = createServerFn({ method: 'POST' })
  .validator(
    (input: {
      name: string
      tagline?: string
      venueName?: string
      startsAt?: string
      endsAt?: string
    }) => input,
  )
  .handler(async ({ data }): Promise<{ id: string; slug: string }> => {
    const userId = await resolveViewer()
    const name = data.name?.trim()
    if (!name) throw new Error('Conference name is required')

    const [row] = await db
      .insert(conference)
      .values({
        slug: await uniqueConferenceSlug(name),
        name,
        tagline: data.tagline?.trim() || null,
        venueName: data.venueName?.trim() || null,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
      })
      .returning()

    await db
      .insert(conferenceMember)
      .values({ conferenceId: row.id, userId, role: 'organizer' })
      .onConflictDoNothing()

    setCookie(CONFERENCE_COOKIE, row.id, COOKIE_OPTS)
    return { id: row.id, slug: row.slug }
  })

/** Join (or change role in) a conference as the viewer. Idempotent per user. */
export const joinConference = createServerFn({ method: 'POST' })
  .validator((input: { id: string; role?: string }) => input)
  .handler(async ({ data }): Promise<{ id: string; role: ConferenceRole }> => {
    const userId = await resolveViewer()
    const role: ConferenceRole = (
      CONFERENCE_ROLES as ReadonlyArray<string>
    ).includes(data.role ?? '')
      ? (data.role as ConferenceRole)
      : 'attendee'

    await db
      .insert(conferenceMember)
      .values({ conferenceId: data.id, userId, role })
      .onConflictDoUpdate({
        target: [conferenceMember.conferenceId, conferenceMember.userId],
        set: { role },
      })

    return { id: data.id, role }
  })

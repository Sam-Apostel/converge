/**
 * Server-only conference helpers. Kept out of `conferences.ts` (which client
 * routes import for its server functions) because these are plain functions
 * that touch the request cookie — like `concierge/viewer.ts`, this module must
 * never be imported directly by a client component.
 */
import { getCookie } from '@tanstack/react-start/server'
import { asc } from 'drizzle-orm'

import { db } from '#/db'
import { conference, conferenceSession } from '#/db/schema'

/** Cookie holding the active conference id. */
export const CONFERENCE_COOKIE = 'converge.conference'

export type ConferenceSummary = {
  id: string
  slug: string
  name: string
  tagline: string | null
  venueName: string | null
  timezone: string
  startsAt: string | null
  endsAt: string | null
  /** Distinct track names appearing in this conference's schedule. */
  tracks: Array<string>
  sessionCount: number
}

/** All conferences with their tracks + session counts, earliest first. */
export async function loadConferenceSummaries(): Promise<
  Array<ConferenceSummary>
> {
  const [confs, sessions] = await Promise.all([
    db.select().from(conference).orderBy(asc(conference.startsAt)),
    db
      .select({
        conferenceId: conferenceSession.conferenceId,
        track: conferenceSession.track,
      })
      .from(conferenceSession),
  ])

  // Aggregate tracks + counts per conference in one pass.
  const tracksByConf = new Map<string, Set<string>>()
  const countByConf = new Map<string, number>()
  for (const s of sessions) {
    countByConf.set(s.conferenceId, (countByConf.get(s.conferenceId) ?? 0) + 1)
    if (s.track) {
      const set = tracksByConf.get(s.conferenceId) ?? new Set<string>()
      set.add(s.track)
      tracksByConf.set(s.conferenceId, set)
    }
  }

  return confs.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    venueName: c.venueName,
    timezone: c.timezone,
    startsAt: c.startsAt ? c.startsAt.toISOString() : null,
    endsAt: c.endsAt ? c.endsAt.toISOString() : null,
    tracks: [...(tracksByConf.get(c.id) ?? [])].sort((a, b) =>
      a.localeCompare(b),
    ),
    sessionCount: countByConf.get(c.id) ?? 0,
  }))
}

/**
 * Pick the active conference from `summaries`: the cookie's choice if valid,
 * otherwise the one happening now, otherwise the earliest.
 */
export function pickActiveConference(
  summaries: Array<ConferenceSummary>,
  cookieValue: string | undefined,
): string | null {
  if (summaries.length === 0) return null
  const chosen = summaries.find(
    (c) => c.id === cookieValue || c.slug === cookieValue,
  )
  if (chosen) return chosen.id

  const now = Date.now()
  const live = summaries.find(
    (c) =>
      c.startsAt &&
      c.endsAt &&
      Date.parse(c.startsAt) <= now &&
      now <= Date.parse(c.endsAt),
  )
  return (live ?? summaries[0]).id
}

/** Active conference id for server-side scoping (sessions, home summary). */
export async function resolveActiveConferenceId(): Promise<string | null> {
  const summaries = await loadConferenceSummaries()
  return pickActiveConference(summaries, getCookie(CONFERENCE_COOKIE))
}

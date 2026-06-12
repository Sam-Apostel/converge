/**
 * Runtime context for the concierge (silo 7).
 *
 * The base system prompt is static; this builds the *situational* facts the
 * model can't know on its own — the current time, who's asking, and which
 * conferences are running (with their dates and venue). Prepended as a second
 * system prompt so answers like "what's on next?" or "is the keynote today?"
 * resolve without a tool round-trip.
 *
 * Server-only (imports `#/db`).
 */
import { asc, eq } from 'drizzle-orm'

import { db } from '#/db'
import { conference, user } from '#/db/schema'

/** Format an instant in a given IANA timezone, e.g. "Friday, 13 June 2025, 14:32 CEST". */
function formatInZone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: timezone,
  }).format(date)
}

/** Date-only label in a timezone, e.g. "13 June 2025". */
function formatDay(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: timezone,
  }).format(date)
}

function describeRange(
  startsAt: Date | null,
  endsAt: Date | null,
  timezone: string,
): string {
  if (!startsAt) return 'dates TBC'
  const start = formatDay(startsAt, timezone)
  if (!endsAt) return start
  const end = formatDay(endsAt, timezone)
  return start === end ? start : `${start} – ${end}`
}

/**
 * Build the situational context block for `userId`. Returns a system-prompt
 * string. Best-effort: any missing piece is simply omitted, and the current
 * time is always included.
 */
export async function buildRuntimeContext(userId: string): Promise<string> {
  const now = new Date()

  const conferences = await db
    .select({
      name: conference.name,
      timezone: conference.timezone,
      startsAt: conference.startsAt,
      endsAt: conference.endsAt,
      venueName: conference.venueName,
    })
    .from(conference)
    .orderBy(asc(conference.startsAt))

  // Co-located conferences share a timezone; fall back to Amsterdam.
  const timezone = conferences[0]?.timezone ?? 'Europe/Amsterdam'

  const viewer = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  const lines: Array<string> = []
  lines.push(`The current date and time is ${formatInZone(now, timezone)}.`)

  if (viewer[0]?.name) {
    lines.push(
      `You are speaking with ${viewer[0].name}. Their schedule and bookmarks are available via the tools.`,
    )
  }

  if (conferences.length > 0) {
    const list = conferences
      .map((c) => {
        const range = describeRange(c.startsAt, c.endsAt, c.timezone)
        const venue = c.venueName ? ` at ${c.venueName}` : ''
        return `- ${c.name}: ${range}${venue}`
      })
      .join('\n')
    lines.push(`Conferences:\n${list}`)
    lines.push(`All session times are in ${timezone}.`)
  }

  return lines.join('\n\n')
}

import { createServerFn } from '@tanstack/react-start'
import { asc, desc, eq, inArray } from 'drizzle-orm'

import { db } from '#/db'
import {
  conference,
  conferenceSession,
  discussion,
  discussionPost,
  profile,
  project,
  room,
  sessionSpeaker,
  user,
} from '#/db/schema'
import type { Person } from '#/db/types'

/** A talk as it appears on a room tile — just what we need to render now/next. */
export type VenueSession = {
  id: string
  title: string
  track: string | null
  startsAt: Date | string | null
  endsAt: Date | string | null
  speaker: { id: string; name: string | null; image: string | null } | null
}

export type VenueRoom = {
  id: string
  name: string
  floor: string | null
  capacity: number | null
  location: { lat: number; lng: number } | null
  /** The talk live in this room at the anchored "now", if any. */
  now: VenueSession | null
  /** The next talk to start in this room after "now". */
  next: VenueSession | null
}

export type VenueDiscussion = {
  id: string
  title: string
  topic: string | null
  posts: number
}

export type Venue = Awaited<ReturnType<typeof loadVenue>>

const isLive = (s: VenueSession, now: number) => {
  const start = s.startsAt ? new Date(s.startsAt).getTime() : null
  const end = s.endsAt ? new Date(s.endsAt).getTime() : null
  return start != null && end != null && start <= now && now < end
}

async function loadVenue() {
  /* The venue screen focuses on one conference — the busiest one wins (the seed
   * has two co-located Amsterdam events). */
  const conferences = await db.select().from(conference)
  const counted = await Promise.all(
    conferences.map(async (c) => ({
      conference: c,
      sessions: await db.$count(
        conferenceSession,
        eq(conferenceSession.conferenceId, c.id),
      ),
    })),
  )
  const active =
    counted.sort((a, b) => b.sessions - a.sessions)[0]?.conference ?? null

  if (!active) {
    return {
      conference: null,
      now: null as string | null,
      rooms: [] as VenueRoom[],
      nextUp: null as { room: VenueRoom; session: VenueSession } | null,
      billboard: {
        projects: [] as never[],
        discussions: [] as VenueDiscussion[],
        people: [] as Person[],
      },
    }
  }

  const [rooms, sessionRows] = await Promise.all([
    db
      .select()
      .from(room)
      .where(eq(room.conferenceId, active.id)),
    db
      .select({
        id: conferenceSession.id,
        title: conferenceSession.title,
        track: conferenceSession.track,
        startsAt: conferenceSession.startsAt,
        endsAt: conferenceSession.endsAt,
        roomId: conferenceSession.roomId,
        speakerId: sessionSpeaker.userId,
        speakerName: user.name,
        speakerImage: user.image,
      })
      .from(conferenceSession)
      .leftJoin(
        sessionSpeaker,
        eq(sessionSpeaker.sessionId, conferenceSession.id),
      )
      .leftJoin(user, eq(user.id, sessionSpeaker.userId))
      .where(eq(conferenceSession.conferenceId, active.id))
      .orderBy(asc(conferenceSession.startsAt)),
  ])

  /* A talk can have several speakers (one row each) — keep the first per talk. */
  const sessions = new Map<string, VenueSession & { roomId: string | null }>()
  for (const r of sessionRows) {
    if (sessions.has(r.id)) continue
    sessions.set(r.id, {
      id: r.id,
      title: r.title,
      track: r.track,
      startsAt: r.startsAt,
      endsAt: r.endsAt,
      roomId: r.roomId,
      speaker: r.speakerId
        ? { id: r.speakerId, name: r.speakerName, image: r.speakerImage }
        : null,
    })
  }

  /* The seed schedule is a past day, so anchor "now" to the middle of the
   * programme (10 min into the median talk) — the venue always reads live. */
  const starts = [...sessions.values()]
    .map((s) => (s.startsAt ? new Date(s.startsAt).getTime() : null))
    .filter((t): t is number => t != null)
    .sort((a, b) => a - b)
  const now = starts.length
    ? starts[Math.floor(starts.length / 2)] + 10 * 60 * 1000
    : Date.now()

  const venueRooms: VenueRoom[] = rooms.map((rm) => {
    const inRoom = [...sessions.values()]
      .filter((s) => s.roomId === rm.id)
      .sort(
        (a, b) =>
          (a.startsAt ? new Date(a.startsAt).getTime() : 0) -
          (b.startsAt ? new Date(b.startsAt).getTime() : 0),
      )
    const live = inRoom.find((s) => isLive(s, now)) ?? null
    const next =
      inRoom.find(
        (s) => s.startsAt != null && new Date(s.startsAt).getTime() > now,
      ) ?? null
    return {
      id: rm.id,
      name: rm.name,
      floor: rm.floor,
      capacity: rm.capacity,
      location: rm.location,
      now: live,
      next,
    }
  })

  /* "Your next session is in {room}" — the soonest upcoming talk venue-wide. */
  const upcoming = [...sessions.values()]
    .filter((s) => s.startsAt != null && new Date(s.startsAt).getTime() > now)
    .sort(
      (a, b) =>
        new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime(),
    )[0]
  const nextUpRoom = upcoming
    ? venueRooms.find((rm) => rm.id === upcoming.roomId)
    : undefined
  const nextUp =
    upcoming && nextUpRoom
      ? { room: nextUpRoom, session: upcoming as VenueSession }
      : null

  /* --- billboard: trending ideas, active threads, featured speakers --- */
  const [projects, discussionRows, postRows] = await Promise.all([
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
      .limit(8),
    db
      .select({
        id: discussion.id,
        title: discussion.title,
        topic: discussion.topic,
      })
      .from(discussion)
      .where(eq(discussion.conferenceId, active.id))
      .orderBy(desc(discussion.updatedAt))
      .limit(6),
    db
      .select({ discussionId: discussionPost.discussionId })
      .from(discussionPost),
  ])

  const postCounts = new Map<string, number>()
  for (const p of postRows) {
    postCounts.set(p.discussionId, (postCounts.get(p.discussionId) ?? 0) + 1)
  }
  const discussions: VenueDiscussion[] = discussionRows.map((d) => ({
    ...d,
    posts: postCounts.get(d.id) ?? 0,
  }))

  /* Featured people = the speakers on stage at this conference (the stars). */
  const speakerIds = [
    ...new Set(sessionRows.map((r) => r.speakerId).filter((x): x is string => !!x)),
  ]
  const people: Person[] = speakerIds.length
    ? (
        await db
          .select({ user, profile })
          .from(user)
          .leftJoin(profile, eq(profile.userId, user.id))
          .where(inArray(user.id, speakerIds))
      )
        .map((r) => ({
          id: r.user.id,
          name: r.user.name,
          image: r.user.image,
          profile: r.profile,
        }))
        .slice(0, 6)
    : []

  return {
    conference: {
      id: active.id,
      name: active.name,
      venueName: active.venueName,
      slug: active.slug,
    },
    now: new Date(now).toISOString(),
    rooms: venueRooms,
    nextUp,
    billboard: { projects, discussions, people },
  }
}

/** Rooms with what's on now/next, the next-session nudge, and the billboard. */
export const getVenue = createServerFn({ method: 'GET' }).handler(loadVenue)

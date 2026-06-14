import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq } from 'drizzle-orm'

import { db } from '#/db'
import {
  conferenceSession,
  discussion,
  moment,
  profile,
  project,
  question,
  room,
  sessionSpeaker,
  user,
} from '#/db/schema'

/**
 * Session-silo server reads (SSR-safe). The schedule list reuses the shared
 * `listSessions` from `#/lib/queries`; the detail screen needs the speaker,
 * the live Q&A, and the people/project woven around the talk — that lives here.
 */

/** Everything the talk OS renders for a single session. */
export const getSessionDetail = createServerFn({ method: 'GET' })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const [session] = await db
      .select({
        id: conferenceSession.id,
        slug: conferenceSession.slug,
        title: conferenceSession.title,
        abstract: conferenceSession.abstract,
        track: conferenceSession.track,
        startsAt: conferenceSession.startsAt,
        endsAt: conferenceSession.endsAt,
        livestreamUrl: conferenceSession.livestreamUrl,
        aiSummary: conferenceSession.aiSummary,
        roomName: room.name,
      })
      .from(conferenceSession)
      .leftJoin(room, eq(room.id, conferenceSession.roomId))
      .where(eq(conferenceSession.slug, slug))
      .limit(1)

    if (!session) return null

    // Slug resolves the talk; everything woven around it keys off the UUID.
    const sessionId = session.id

    const [speaker] = await db
      .select({
        id: user.id,
        name: user.name,
        image: user.image,
        title: profile.title,
        company: profile.company,
        socials: profile.socials,
      })
      .from(sessionSpeaker)
      .innerJoin(user, eq(user.id, sessionSpeaker.userId))
      .leftJoin(profile, eq(profile.userId, user.id))
      .where(eq(sessionSpeaker.sessionId, sessionId))
      .limit(1)

    // Live questions, hottest first — the real rows, with author + company.
    const questions = await db
      .select({
        id: question.id,
        body: question.body,
        upvotes: question.upvotes,
        status: question.status,
        createdAt: question.createdAt,
        authorId: question.authorId,
        authorName: user.name,
        authorImage: user.image,
        authorCompany: profile.company,
      })
      .from(question)
      .innerJoin(user, eq(user.id, question.authorId))
      .leftJoin(profile, eq(profile.userId, user.id))
      .where(eq(question.sessionId, sessionId))
      .orderBy(desc(question.upvotes))

    // Related project: prefer one linked to this session through a discussion,
    // otherwise fall back to the trending project so the rail is never empty.
    const [linkedProject] = await db
      .select({
        name: project.name,
        slug: project.slug,
        tagline: project.tagline,
        ownerName: user.name,
      })
      .from(discussion)
      .innerJoin(project, eq(project.id, discussion.projectId))
      .leftJoin(user, eq(user.id, project.ownerId))
      .where(eq(discussion.sessionId, sessionId))
      .limit(1)

    // The session's own discussion thread, if one exists (the Discussion tab
    // links here). Prefer the most recent — a busy talk may spin out several.
    const [linkedDiscussion] = await db
      .select({ id: discussion.id })
      .from(discussion)
      .where(eq(discussion.sessionId, sessionId))
      .orderBy(desc(discussion.createdAt))
      .limit(1)
    const discussionId = linkedDiscussion?.id ?? null

    let relatedProject = linkedProject ?? null
    if (!relatedProject) {
      const [trending] = await db
        .select({
          name: project.name,
          slug: project.slug,
          tagline: project.tagline,
          ownerName: user.name,
        })
        .from(project)
        .leftJoin(user, eq(user.id, project.ownerId))
        .orderBy(desc(project.trendingScore))
        .limit(1)
      relatedProject = trending ?? null
    }

    // "In the room for you" — the people driving this talk's Q&A.
    const relatedPeople: Array<{
      id: string
      name: string
      image: string | null
      note: string
    }> = []
    const seen = new Set<string>()
    for (const q of questions) {
      if (seen.has(q.authorId)) continue
      seen.add(q.authorId)
      relatedPeople.push({
        id: q.authorId,
        name: q.authorName,
        image: q.authorImage,
        note:
          relatedPeople.length === 0
            ? 'asked the top question'
            : 'active in the Q&A',
      })
      if (relatedPeople.length >= 2) break
    }

    // AI-flagged highlight moments from this talk (any attendee), newest first.
    const highlights = await db
      .select({
        id: moment.id,
        timestampMs: moment.timestampMs,
        transcriptSnippet: moment.transcriptSnippet,
        capturedByName: user.name,
      })
      .from(moment)
      .innerJoin(user, eq(user.id, moment.userId))
      .where(and(eq(moment.sessionId, sessionId), eq(moment.aiHighlight, true)))
      .orderBy(desc(moment.timestampMs))
      .limit(5)

    return {
      session,
      speaker: speaker ?? null,
      questions,
      discussionId,
      relatedProject,
      relatedPeople,
      highlights,
    }
  })

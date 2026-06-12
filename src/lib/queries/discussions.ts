import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'

import { db } from '#/db'
import {
  conferenceSession,
  discussion,
  discussionPost,
  profile,
  question,
  questionVote,
  sessionSpeaker,
  user,
} from '#/db/schema'
import { auth } from '#/lib/auth'

/* ------------------------------------------------------------------ */
/* Serialized shapes (safe to read in client components)               */
/* ------------------------------------------------------------------ */

export type DiscussionAuthor = {
  id: string
  name: string
  image: string | null
  company: string | null
  /** Authored the talk this thread grew out of → gets the SPEAKER badge. */
  isSpeaker: boolean
}

export type ThreadPost = {
  id: string
  parentId: string | null
  body: string
  author: DiscussionAuthor
  /** The thread author circling back after the first answer. */
  isFollowUp: boolean
  /** Direct replies threaded under this post. */
  replyCount: number
}

export type ThreadQuestion = {
  id: string
  body: string
  upvotes: number
  /** Whether the current viewer has upvoted (drives the toggle). */
  hasVoted: boolean
  status: string
  author: DiscussionAuthor | null
}

export type DiscussionThread = {
  id: string
  title: string
  topic: string | null
  sessionId: string | null
  sessionTitle: string | null
  question: ThreadQuestion | null
  posts: Array<ThreadPost>
  participants: Array<DiscussionAuthor>
}

export type TopicChannel = {
  topic: string
  posts: number
  active: boolean
}

export type TrendingQuestion = {
  id: string
  body: string
  upvotes: number
  hasVoted: boolean
  sessionTitle: string | null
  followUps: number
}

export type DiscussionsIndex = {
  channels: Array<TopicChannel>
  featured: DiscussionThread | null
  trending: TrendingQuestion | null
}

/* ------------------------------------------------------------------ */
/* Internals                                                           */
/* ------------------------------------------------------------------ */

type DiscussionRow = {
  id: string
  title: string
  topic: string | null
  sessionId: string | null
  questionId: string | null
  createdById: string | null
}

const discussionColumns = {
  id: discussion.id,
  title: discussion.title,
  topic: discussion.topic,
  sessionId: discussion.sessionId,
  questionId: discussion.questionId,
  createdById: discussion.createdById,
}

/** The signed-in viewer's user id, or null for anonymous requests. */
async function viewerId(): Promise<string | null> {
  const headers = new Headers(getRequestHeaders() as HeadersInit)
  const session = await auth.api.getSession({ headers })
  return session?.user.id ?? null
}

/** Which of `questionIds` the viewer has upvoted — empty when signed out. */
async function votedQuestionIds(
  userId: string | null,
  questionIds: Array<string>,
): Promise<Set<string>> {
  if (!userId || questionIds.length === 0) return new Set()
  const rows = await db
    .select({ questionId: questionVote.questionId })
    .from(questionVote)
    .where(
      and(
        eq(questionVote.userId, userId),
        inArray(questionVote.questionId, questionIds),
      ),
    )
  return new Set(rows.map((r) => r.questionId))
}

/**
 * Hydrate a set of discussion rows into full threads — posts with authors, the
 * root question, the talk it grew from, and which authors are speakers. One
 * round of queries regardless of how many discussions are passed in.
 */
async function loadThreads(
  rows: Array<DiscussionRow>,
  viewer: string | null,
): Promise<Array<DiscussionThread>> {
  if (rows.length === 0) return []

  const ids = rows.map((r) => r.id)
  const questionIds = rows
    .map((r) => r.questionId)
    .filter((v): v is string => !!v)
  const sessionIds = rows
    .map((r) => r.sessionId)
    .filter((v): v is string => !!v)

  const [postRows, questionRows, sessionRows, speakerRows, voted] =
    await Promise.all([
      db
        .select({
          id: discussionPost.id,
          discussionId: discussionPost.discussionId,
          parentId: discussionPost.parentId,
          body: discussionPost.body,
          authorId: user.id,
          authorName: user.name,
          authorImage: user.image,
          authorCompany: profile.company,
        })
        .from(discussionPost)
        .innerJoin(user, eq(user.id, discussionPost.authorId))
        .leftJoin(profile, eq(profile.userId, user.id))
        .where(inArray(discussionPost.discussionId, ids))
        .orderBy(asc(discussionPost.createdAt)),
      questionIds.length
        ? db
            .select({
              id: question.id,
              body: question.body,
              upvotes: question.upvotes,
              status: question.status,
              authorId: user.id,
              authorName: user.name,
              authorImage: user.image,
              authorCompany: profile.company,
            })
            .from(question)
            .innerJoin(user, eq(user.id, question.authorId))
            .leftJoin(profile, eq(profile.userId, user.id))
            .where(inArray(question.id, questionIds))
        : Promise.resolve([]),
      sessionIds.length
        ? db
            .select({
              id: conferenceSession.id,
              title: conferenceSession.title,
            })
            .from(conferenceSession)
            .where(inArray(conferenceSession.id, sessionIds))
        : Promise.resolve([]),
      sessionIds.length
        ? db
            .select({
              sessionId: sessionSpeaker.sessionId,
              userId: sessionSpeaker.userId,
            })
            .from(sessionSpeaker)
            .where(inArray(sessionSpeaker.sessionId, sessionIds))
        : Promise.resolve([]),
      votedQuestionIds(viewer, questionIds),
    ])

  const sessionTitle = new Map(sessionRows.map((s) => [s.id, s.title]))
  const questionById = new Map(questionRows.map((q) => [q.id, q]))
  const speakersBySession = new Map<string, Set<string>>()
  for (const s of speakerRows) {
    const set = speakersBySession.get(s.sessionId) ?? new Set<string>()
    set.add(s.userId)
    speakersBySession.set(s.sessionId, set)
  }

  return rows.map((row) => {
    const speakers = row.sessionId
      ? (speakersBySession.get(row.sessionId) ?? new Set<string>())
      : new Set<string>()

    const author = (
      id: string,
      name: string,
      image: string | null,
      company: string | null,
    ): DiscussionAuthor => ({
      id,
      name,
      image,
      company,
      isSpeaker: speakers.has(id),
    })

    const mine = postRows.filter((p) => p.discussionId === row.id)
    const replyCounts = new Map<string, number>()
    for (const p of mine) {
      if (p.parentId)
        replyCounts.set(p.parentId, (replyCounts.get(p.parentId) ?? 0) + 1)
    }

    const posts: Array<ThreadPost> = mine.map((p, i) => ({
      id: p.id,
      parentId: p.parentId,
      body: p.body,
      author: author(p.authorId, p.authorName, p.authorImage, p.authorCompany),
      isFollowUp: i > 0 && p.authorId === row.createdById,
      replyCount: replyCounts.get(p.id) ?? 0,
    }))

    const q = row.questionId ? questionById.get(row.questionId) : undefined
    const threadQuestion: ThreadQuestion | null = q
      ? {
          id: q.id,
          body: q.body,
          upvotes: q.upvotes,
          hasVoted: voted.has(q.id),
          status: q.status,
          author: author(
            q.authorId,
            q.authorName,
            q.authorImage,
            q.authorCompany,
          ),
        }
      : null

    // Unique participants, question author first (they opened the thread).
    const seen = new Set<string>()
    const participants: Array<DiscussionAuthor> = []
    const add = (a: DiscussionAuthor | null) => {
      if (a && !seen.has(a.id)) {
        seen.add(a.id)
        participants.push(a)
      }
    }
    add(threadQuestion?.author ?? null)
    for (const p of posts) add(p.author)

    return {
      id: row.id,
      title: row.title,
      topic: row.topic,
      sessionId: row.sessionId,
      sessionTitle: row.sessionId
        ? (sessionTitle.get(row.sessionId) ?? null)
        : null,
      question: threadQuestion,
      posts,
      participants,
    }
  })
}

/* ------------------------------------------------------------------ */
/* Server functions                                                    */
/* ------------------------------------------------------------------ */

/** Index payload: topic channels, the most-active thread, the trending question. */
export const listDiscussions = createServerFn({ method: 'GET' }).handler(
  async (): Promise<DiscussionsIndex> => {
    const viewer = await viewerId()
    const rows = await db
      .select(discussionColumns)
      .from(discussion)
      .orderBy(desc(discussion.updatedAt))

    const threads = await loadThreads(rows, viewer)

    // Channels map to discussion.topic; size them by thread activity.
    const byTopic = new Map<string, number>()
    for (const t of threads) {
      if (!t.topic) continue
      byTopic.set(t.topic, (byTopic.get(t.topic) ?? 0) + t.posts.length + 1)
    }
    const channels: Array<TopicChannel> = [...byTopic.entries()]
      .map(([topic, posts]) => ({ topic, posts, active: false }))
      .sort((a, b) => b.posts - a.posts)
    if (channels[0]) channels[0].active = true

    // Featured: the liveliest thread, preferring one rooted in a real question.
    const featured =
      [...threads].sort((a, b) => {
        const q = Number(!!b.question) - Number(!!a.question)
        return q !== 0 ? q : b.posts.length - a.posts.length
      })[0] ?? null

    // Trending: the most-upvoted question, with its talk + follow-up count.
    const [topQuestion] = await db
      .select({
        id: question.id,
        body: question.body,
        upvotes: question.upvotes,
        sessionTitle: conferenceSession.title,
      })
      .from(question)
      .leftJoin(conferenceSession, eq(conferenceSession.id, question.sessionId))
      .orderBy(desc(question.upvotes))
      .limit(1)

    const trendingVoted = await votedQuestionIds(
      viewer,
      topQuestion ? [topQuestion.id] : [],
    )
    const trending: TrendingQuestion | null = topQuestion
      ? {
          id: topQuestion.id,
          body: topQuestion.body,
          upvotes: topQuestion.upvotes,
          hasVoted: trendingVoted.has(topQuestion.id),
          sessionTitle: topQuestion.sessionTitle,
          followUps:
            threads.find((t) => t.question?.id === topQuestion.id)?.posts
              .length ?? 0,
        }
      : null

    return { channels, featured, trending }
  },
)

/** A single thread by id, or null when it doesn't exist. */
export const getDiscussion = createServerFn({ method: 'GET' })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<DiscussionThread | null> => {
    const viewer = await viewerId()
    const rows = await db
      .select(discussionColumns)
      .from(discussion)
      .where(eq(discussion.id, id))
      .limit(1)

    const [thread] = await loadThreads(rows, viewer)
    return thread ?? null
  })

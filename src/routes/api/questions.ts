import { createFileRoute } from '@tanstack/react-router'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'

import { db } from '#/db'
import { answer, profile, question, questionVote, user } from '#/db/schema'
import type {
  QuestionAnswer,
  SessionQuestion,
} from '#/db-collections/questions'
import { publish } from '#/lib/events'
import { requireUser } from '#/lib/server-auth'

/**
 * Questions API — backs the `questionsCollection`. GET lists a session's live
 * questions (hottest first) with their answers and the viewer's vote state;
 * POST asks a new one and publishes `question.created` so other clients see it
 * land in real time. Voting and promotion live in the `$id` sibling routes.
 */

/** Hydrate question rows into the full `SessionQuestion` shape for `viewerId`. */
async function loadQuestions(
  sessionId: string,
  viewerId: string,
): Promise<Array<SessionQuestion>> {
  const rows = await db
    .select({
      id: question.id,
      sessionId: question.sessionId,
      authorId: question.authorId,
      body: question.body,
      status: question.status,
      upvotes: question.upvotes,
      promotedDiscussionId: question.promotedDiscussionId,
      createdAt: question.createdAt,
      authorName: user.name,
      authorImage: user.image,
      authorCompany: profile.company,
    })
    .from(question)
    .innerJoin(user, eq(user.id, question.authorId))
    .leftJoin(profile, eq(profile.userId, user.id))
    .where(eq(question.sessionId, sessionId))
    .orderBy(desc(question.upvotes), asc(question.createdAt))

  const ids = rows.map((r) => r.id)
  if (ids.length === 0) return []

  const [answerRows, voteRows] = await Promise.all([
    db
      .select({
        id: answer.id,
        questionId: answer.questionId,
        body: answer.body,
        fromSpeaker: answer.fromSpeaker,
        createdAt: answer.createdAt,
        authorId: user.id,
        authorName: user.name,
        authorImage: user.image,
      })
      .from(answer)
      .innerJoin(user, eq(user.id, answer.authorId))
      .where(inArray(answer.questionId, ids))
      .orderBy(asc(answer.createdAt)),
    db
      .select({ questionId: questionVote.questionId })
      .from(questionVote)
      .where(
        and(
          inArray(questionVote.questionId, ids),
          eq(questionVote.userId, viewerId),
        ),
      ),
  ])

  const votedIds = new Set(voteRows.map((v) => v.questionId))
  const answersByQuestion = new Map<string, Array<QuestionAnswer>>()
  for (const a of answerRows) {
    const list = answersByQuestion.get(a.questionId) ?? []
    list.push({
      id: a.id,
      body: a.body,
      fromSpeaker: a.fromSpeaker,
      authorId: a.authorId,
      authorName: a.authorName,
      authorImage: a.authorImage,
      createdAt: a.createdAt.toISOString(),
    })
    answersByQuestion.set(a.questionId, list)
  }

  return rows.map((r) => ({
    id: r.id,
    sessionId: r.sessionId,
    authorId: r.authorId,
    body: r.body,
    status: r.status,
    upvotes: r.upvotes,
    hasVoted: votedIds.has(r.id),
    promotedDiscussionId: r.promotedDiscussionId,
    createdAt: r.createdAt.toISOString(),
    authorName: r.authorName,
    authorImage: r.authorImage,
    authorCompany: r.authorCompany,
    answers: answersByQuestion.get(r.id) ?? [],
  }))
}

export const Route = createFileRoute('/api/questions')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const sessionId = new URL(request.url).searchParams.get('sessionId')
        if (!sessionId) return Response.json([], { status: 400 })
        const { id: userId } = await requireUser(request)
        return Response.json(await loadQuestions(sessionId, userId))
      },

      POST: async ({ request }) => {
        const { id: userId } = await requireUser(request)
        const body = (await request.json()) as {
          sessionId: string
          body: string
        }
        const text = body.body?.trim()
        if (!body.sessionId || !text) {
          return new Response('Missing sessionId or body', { status: 400 })
        }

        const [row] = await db
          .insert(question)
          .values({ sessionId: body.sessionId, authorId: userId, body: text })
          .returning()

        // Let other tabs/devices see the question land in real time.
        publish({
          type: 'question.created',
          channel: `session:${body.sessionId}`,
          data: row,
        })

        const hydrated = await loadQuestions(body.sessionId, userId)
        const created = hydrated.find((q) => q.id === row.id)
        return Response.json(created ?? row, { status: 201 })
      },
    },
  },
})

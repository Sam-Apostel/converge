import { QueryClient } from '@tanstack/react-query'
import { createCollection } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'

/**
 * Live Q&A collection — the optimistic client store behind a talk's "Live
 * questions" tab. Asking `insert`s a question that shows instantly and persists
 * via `POST /api/questions`; upvoting and answering go through `update` and are
 * persisted by `onUpdate`. Promotion to a discussion is a one-shot action and
 * runs outside the collection (see `promoteQuestion`).
 *
 * One collection per `sessionId`, memoised. Read it with `useLiveQuery`
 * (client-only — never in an SSR loader). Mirrors `src/db-collections/moments`.
 */

export type QuestionAnswer = {
  id: string
  body: string
  fromSpeaker: boolean
  authorId: string
  authorName: string
  authorImage: string | null
  createdAt: string
}

/** The shape `GET /api/questions` returns and the collection stores. */
export type SessionQuestion = {
  id: string
  sessionId: string | null
  authorId: string
  body: string
  status: string
  upvotes: number
  /** Whether the current viewer has upvoted (drives the toggle). */
  hasVoted: boolean
  /** Set once the question has been promoted into a discussion thread. */
  promotedDiscussionId: string | null
  createdAt: string
  authorName: string
  authorImage: string | null
  authorCompany: string | null
  answers: Array<QuestionAnswer>
}

const queryClient = new QueryClient()

async function getJson<T>(input: string): Promise<T> {
  const res = await fetch(input)
  if (!res.ok) throw new Error(`${input} -> ${res.status}`)
  return res.json() as Promise<T>
}

const cache = new Map<string, ReturnType<typeof makeCollection>>()

function makeCollection(sessionId: string) {
  return createCollection(
    queryCollectionOptions({
      queryKey: ['questions', sessionId],
      queryClient,
      queryFn: () =>
        getJson<Array<SessionQuestion>>(
          `/api/questions?sessionId=${encodeURIComponent(sessionId)}`,
        ),
      getKey: (q: SessionQuestion) => q.id,
      onInsert: async ({ transaction }) => {
        const draft = transaction.mutations[0].modified as SessionQuestion
        await fetch('/api/questions', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId, body: draft.body }),
        })
        // Reconcile the optimistic temp id with the persisted row.
        await cache.get(sessionId)?.utils.refetch()
      },
      onUpdate: async ({ transaction }) => {
        for (const m of transaction.mutations) {
          const before = m.original as SessionQuestion
          const after = m.modified as SessionQuestion

          // Upvote toggle — the endpoint flips the viewer's vote and returns
          // the authoritative count. The optimistic ±1 already landed; we let
          // the next natural refetch settle any drift.
          if (before.hasVoted !== after.hasVoted) {
            await fetch(`/api/questions/${after.id}/vote`, { method: 'POST' })
            continue
          }

          // A new answer was appended to `answers`.
          if (after.answers.length > before.answers.length) {
            const added = after.answers.find(
              (a) => !before.answers.some((p) => p.id === a.id),
            )
            if (added) {
              await fetch('/api/answers', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ questionId: after.id, body: added.body }),
              })
              // Pull the server-authoritative answer (real id + fromSpeaker).
              await cache.get(sessionId)?.utils.refetch()
            }
          }
        }
      },
    }),
  )
}

/** The memoised live-questions collection for one session. */
export function questionsCollection(sessionId: string) {
  let collection = cache.get(sessionId)
  if (!collection) {
    collection = makeCollection(sessionId)
    cache.set(sessionId, collection)
  }
  return collection
}

/**
 * Promote a question into a persistent discussion. Runs outside the collection
 * (one POST that returns the new discussion id), then refetches so the session
 * Q&A shows the "Continued in discussion" chip. Returns the discussion id.
 */
export async function promoteQuestion(
  sessionId: string,
  questionId: string,
): Promise<string | null> {
  const res = await fetch(`/api/questions/${questionId}/promote`, {
    method: 'POST',
  })
  if (!res.ok) return null
  const { discussionId } = (await res.json()) as { discussionId: string }
  await cache.get(sessionId)?.utils.refetch()
  return discussionId
}

import { QueryClient } from '@tanstack/react-query'
import { createCollection } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'

import type { Moment } from '#/db/types'

/**
 * Moments collection — the optimistic client store behind a talk's "Your
 * moments" rail. Bookmarking a slide `insert`s a moment that shows instantly
 * and persists via `POST /api/moments`; removing it `delete`s and `DELETE`s.
 *
 * Moments are scoped per session, so the collection is created per `sessionId`
 * and memoised here. Read it with `useLiveQuery` (client-only — never in an SSR
 * loader). See `src/db-collections/index.ts` for the base pattern.
 */

const queryClient = new QueryClient()

async function getJson<T>(input: string): Promise<T> {
  const res = await fetch(input)
  if (!res.ok) throw new Error(`${input} -> ${res.status}`)
  return res.json() as Promise<T>
}

const collections = new Map<
  string,
  ReturnType<typeof createMomentsCollection>
>()

function createMomentsCollection(sessionId: string) {
  return createCollection(
    queryCollectionOptions({
      queryKey: ['moments', sessionId],
      queryClient,
      queryFn: () =>
        getJson<Array<Moment>>(
          `/api/moments?sessionId=${encodeURIComponent(sessionId)}`,
        ),
      getKey: (moment) => moment.id,
      onInsert: async ({ transaction }) => {
        const draft = transaction.mutations[0].modified
        await fetch('/api/moments', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            sessionId: draft.sessionId,
            timestampMs: draft.timestampMs,
            slideRef: draft.slideRef,
            transcriptSnippet: draft.transcriptSnippet,
            note: draft.note,
          }),
        })
      },
      onUpdate: async ({ transaction }) => {
        // Only the inline note is editable; persist it to the viewer's moment.
        const { modified } = transaction.mutations[0]
        await fetch(`/api/moments?id=${encodeURIComponent(modified.id)}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ note: modified.note }),
        })
      },
      onDelete: async ({ transaction }) => {
        const { original } = transaction.mutations[0]
        await fetch(`/api/moments?id=${encodeURIComponent(original.id)}`, {
          method: 'DELETE',
        })
      },
    }),
  )
}

/** The memoised moments collection for one session. */
export function momentsCollection(sessionId: string) {
  let collection = collections.get(sessionId)
  if (!collection) {
    collection = createMomentsCollection(sessionId)
    collections.set(sessionId, collection)
  }
  return collection
}

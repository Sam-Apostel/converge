import { QueryClient } from '@tanstack/react-query'
import { createCollection } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'

import type { MessageRow } from '#/components/messages/types'

/**
 * Optimistic message store for the Messages screen.
 *
 * One collection per viewer (`me`) holding *all* of their messages. The
 * conversation pane reads it with `useLiveQuery` and filters to the open
 * thread; sending `insert`s optimistically and `onInsert` persists via the API,
 * rolling back automatically if the POST throws.
 *
 * TanStack DB is client-only — only touch this from components (after mount),
 * never during SSR. Collections are cached per `me` so a given viewer always
 * gets the same reactive instance.
 */

const queryClient = new QueryClient()

async function getJson<T>(input: string): Promise<T> {
  const res = await fetch(input)
  if (!res.ok) throw new Error(`${input} -> ${res.status}`)
  return res.json() as Promise<T>
}

type MessagesCollection = ReturnType<typeof makeCollection>

function makeCollection(me: string) {
  return createCollection(
    queryCollectionOptions({
      queryKey: ['messages', me],
      queryClient,
      queryFn: () =>
        getJson<Array<MessageRow>>(
          `/api/messages?me=${encodeURIComponent(me)}`,
        ),
      getKey: (m: MessageRow) => m.id,
      onInsert: async ({ transaction }) => {
        const draft = transaction.mutations[0].modified as MessageRow
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            fromUserId: draft.fromUserId,
            toUserId: draft.toUserId,
            body: draft.body,
          }),
        })
      },
    }),
  )
}

const cache = new Map<string, MessagesCollection>()

/** Stable, reactive message collection for a viewer. */
export function messagesCollection(me: string): MessagesCollection {
  let collection = cache.get(me)
  if (!collection) {
    collection = makeCollection(me)
    cache.set(me, collection)
  }
  return collection
}

/** Pull fresh server truth — call after a realtime `message.created`. */
export function refetchMessages(me: string): void {
  cache.get(me)?.utils.refetch()
}

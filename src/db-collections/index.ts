import { QueryClient } from '@tanstack/react-query'
import { createCollection } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'

import type { Project, Task } from '#/db/types'

/**
 * TanStack DB collections — the reactive client store for Converge.
 *
 * Each collection is backed by a REST endpoint via TanStack Query. Reads come
 * from `useLiveQuery`; writes (`collection.insert/update/delete`) apply
 * optimistically and the `onInsert`/`onUpdate`/`onDelete` handlers persist to
 * the API, rolling back automatically if the request throws.
 *
 * NOTE: TanStack DB is client-only. Routes that read a collection during render
 * should disable SSR (`ssr: false`) or read via a server function instead.
 */

// A dedicated QueryClient for collections keeps their cache independent of the
// router's SSR query client.
const queryClient = new QueryClient()

async function getJson<T>(input: string): Promise<T> {
  const res = await fetch(input)
  if (!res.ok) throw new Error(`${input} -> ${res.status}`)
  return res.json() as Promise<T>
}

export const projectsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['projects'],
    queryClient,
    queryFn: () => getJson<Array<Project>>('/api/projects'),
    getKey: (project) => project.id,
    onInsert: async ({ transaction }) => {
      const draft = transaction.mutations[0].modified
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(draft),
      })
    },
  }),
)

export const tasksCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['tasks'],
    queryClient,
    queryFn: () => getJson<Array<Task>>('/api/tasks'),
    getKey: (task) => task.id,
  }),
)

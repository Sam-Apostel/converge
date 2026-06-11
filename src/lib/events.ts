/**
 * Minimal in-process pub/sub used to push real-time updates to clients over
 * Server-Sent Events (see `src/routes/api/stream.ts`).
 *
 * This is per-instance. For a multi-replica Railway deployment, swap the
 * internals for Postgres `LISTEN/NOTIFY` or Redis pub/sub — the `publish` /
 * `subscribe` surface can stay the same.
 */

export type ConvergeEvent = {
  /** e.g. "moment.created", "question.created", "session.updated" */
  type: string
  data: unknown
  /** Optional scoping so the SSE route can filter (e.g. a session id). */
  channel?: string
}

type Listener = (event: ConvergeEvent) => void

const listeners = new Set<Listener>()

export function publish(event: ConvergeEvent): void {
  for (const listener of listeners) {
    try {
      listener(event)
    } catch {
      // never let one bad subscriber break the fan-out
    }
  }
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

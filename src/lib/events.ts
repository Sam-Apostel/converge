/**
 * Pub/sub for real-time updates pushed to clients over Server-Sent Events
 * (see `src/routes/api/stream.ts`).
 *
 * Local fan-out is always in-process and synchronous. On top of that, a
 * best-effort Postgres `LISTEN/NOTIFY` bridge mirrors events across replicas so
 * a multi-instance Railway deployment stays consistent: `publish` also `NOTIFY`s
 * a channel, and a dedicated `LISTEN` connection replays events from *other*
 * instances into the local fan-out. The bridge is entirely fault-tolerant — if
 * there's no `DATABASE_URL`, the connection drops, or a payload is too large for
 * `NOTIFY` (8 kB limit), it silently degrades to in-process-only, exactly as
 * before. The `publish` / `subscribe` surface is unchanged.
 */
import { randomUUID } from 'node:crypto'

import { pool } from '#/db'

export type ConvergeEvent = {
  /** e.g. "moment.created", "question.created", "session.updated" */
  type: string
  data: unknown
  /** Optional scoping so the SSE route can filter (e.g. a session id). */
  channel?: string
}

type Listener = (event: ConvergeEvent) => void

const listeners = new Set<Listener>()

// Identifies this process so we ignore the NOTIFY echo of our own publishes
// (we already fanned those out locally).
const INSTANCE_ID = randomUUID()
const PG_CHANNEL = 'converge_events'
const MAX_NOTIFY_BYTES = 7_000

/** Deliver to every in-process subscriber, isolating bad ones. */
function fanOut(event: ConvergeEvent): void {
  for (const listener of listeners) {
    try {
      listener(event)
    } catch {
      // never let one bad subscriber break the fan-out
    }
  }
}

export function publish(event: ConvergeEvent): void {
  // Local subscribers first — synchronous, always works.
  fanOut(event)
  // Then mirror to other replicas, best-effort.
  void notifyOtherReplicas(event)
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  // Lazily bring up the cross-replica listener the first time anyone subscribes.
  ensureBridge()
  return () => {
    listeners.delete(listener)
  }
}

async function notifyOtherReplicas(event: ConvergeEvent): Promise<void> {
  if (!process.env.DATABASE_URL) return
  try {
    const payload = JSON.stringify({ from: INSTANCE_ID, event })
    if (Buffer.byteLength(payload) > MAX_NOTIFY_BYTES) return // too big for NOTIFY
    // Parameterised NOTIFY via pg_notify so the JSON is safely escaped.
    await pool.query('select pg_notify($1, $2)', [PG_CHANNEL, payload])
  } catch {
    // Degrade to in-process-only; realtime still works on this instance.
  }
}

let bridgeStarted = false

/** Open a dedicated LISTEN connection (once) that replays remote events. */
function ensureBridge(): void {
  if (bridgeStarted || !process.env.DATABASE_URL) return
  bridgeStarted = true
  connectListener()
}

function connectListener(): void {
  pool
    .connect()
    .then((client) => {
      client.on('notification', (msg) => {
        if (msg.channel !== PG_CHANNEL || !msg.payload) return
        try {
          const { from, event } = JSON.parse(msg.payload) as {
            from: string
            event: ConvergeEvent
          }
          if (from === INSTANCE_ID) return // already fanned out locally
          fanOut(event)
        } catch {
          // ignore malformed payloads
        }
      })
      client.on('error', () => {
        client.release()
        scheduleReconnect()
      })
      client.query(`LISTEN ${PG_CHANNEL}`).catch(() => {
        client.release()
        scheduleReconnect()
      })
    })
    .catch(() => {
      // Couldn't get a connection — retry later; local fan-out is unaffected.
      scheduleReconnect()
    })
}

function scheduleReconnect(): void {
  setTimeout(connectListener, 5_000)
}

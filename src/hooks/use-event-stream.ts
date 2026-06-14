import { useEffect, useRef } from 'react'

type ConnectionStatus = 'connecting' | 'open' | 'reconnecting'

type EventStreamOptions = {
  /** Scope to a channel, e.g. `session:<id>`. */
  channel?: string
  /** Called for every named event (the SSE `event:` field). */
  onEvent?: (type: string, data: unknown) => void
  /** Called when the connection state changes (connect / drop / recover). */
  onStatus?: (status: ConnectionStatus) => void
}

// EventSource dispatches by event name; listen to the ones we emit plus the
// default `message`.
const EVENTS = [
  'message',
  'ready',
  'message.created',
  'moment.created',
  'question.created',
  'discussion.post',
  'session.updated',
] as const

const BASE_DELAY_MS = 1_000
const MAX_DELAY_MS = 30_000

/**
 * Subscribe to the Converge SSE stream (`/api/stream`) for the lifetime of a
 * component. Pass a `channel` to filter and `onEvent` to react to updates.
 *
 * The browser's `EventSource` auto-reconnects, but it retries on a fixed
 * cadence and gives up after a hard error. This hook takes over: on any drop it
 * tears the connection down and reopens with exponential backoff + jitter
 * (capped at 30s), resetting the delay once a connection is healthy again. Use
 * `onStatus` to surface a "reconnecting…" indicator.
 */
export function useEventStream({
  channel,
  onEvent,
  onStatus,
}: EventStreamOptions = {}) {
  // Keep the latest callbacks in refs so changing them doesn't tear down and
  // re-open the stream (which would reset the backoff and drop events).
  const onEventRef = useRef(onEvent)
  const onStatusRef = useRef(onStatus)
  onEventRef.current = onEvent
  onStatusRef.current = onStatus

  useEffect(() => {
    const url = channel
      ? `/api/stream?channel=${encodeURIComponent(channel)}`
      : '/api/stream'

    let source: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined
    let attempts = 0
    let closed = false

    const handler = (event: MessageEvent) => {
      // Any inbound event proves the link is healthy — reset the backoff.
      attempts = 0
      let data: unknown = event.data
      try {
        data = JSON.parse(event.data)
      } catch {
        // leave as raw string
      }
      onEventRef.current?.(event.type, data)
    }

    const connect = () => {
      if (closed) return
      onStatusRef.current?.(attempts === 0 ? 'connecting' : 'reconnecting')
      source = new EventSource(url)
      source.onopen = () => {
        attempts = 0
        onStatusRef.current?.('open')
      }
      for (const name of EVENTS) source.addEventListener(name, handler)
      source.onerror = () => {
        // Don't trust EventSource's own retry — take control of the cadence.
        source?.close()
        source = null
        if (closed) return
        const delay = Math.min(BASE_DELAY_MS * 2 ** attempts, MAX_DELAY_MS)
        const jittered = delay / 2 + Math.random() * (delay / 2)
        attempts += 1
        onStatusRef.current?.('reconnecting')
        reconnectTimer = setTimeout(connect, jittered)
      }
    }

    connect()

    return () => {
      closed = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (source) {
        for (const name of EVENTS) source.removeEventListener(name, handler)
        source.close()
      }
    }
  }, [channel])
}

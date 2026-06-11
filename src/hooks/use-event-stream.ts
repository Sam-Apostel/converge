import { useEffect } from 'react'

type EventStreamOptions = {
  /** Scope to a channel, e.g. `session:<id>`. */
  channel?: string
  /** Called for every named event (the SSE `event:` field). */
  onEvent?: (type: string, data: unknown) => void
}

/**
 * Subscribe to the Converge SSE stream (`/api/stream`) for the lifetime of a
 * component. Pass a `channel` to filter, and `onEvent` to react to updates.
 */
export function useEventStream({ channel, onEvent }: EventStreamOptions = {}) {
  useEffect(() => {
    const url = channel
      ? `/api/stream?channel=${encodeURIComponent(channel)}`
      : '/api/stream'
    const source = new EventSource(url)

    const handler = (event: MessageEvent) => {
      let data: unknown = event.data
      try {
        data = JSON.parse(event.data)
      } catch {
        // leave as raw string
      }
      onEvent?.(event.type, data)
    }

    // EventSource dispatches by event name; listen to the ones we emit plus the
    // default `message`.
    const events = [
      'message',
      'ready',
      'moment.created',
      'question.created',
      'discussion.post',
      'session.updated',
    ]
    for (const name of events) source.addEventListener(name, handler)

    return () => {
      for (const name of events) source.removeEventListener(name, handler)
      source.close()
    }
  }, [channel, onEvent])
}

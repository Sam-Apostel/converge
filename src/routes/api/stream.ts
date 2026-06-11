import { createFileRoute } from '@tanstack/react-router'

import { subscribe } from '#/lib/events'

/**
 * Server-Sent Events endpoint. Streams Converge events (new moments, questions,
 * discussion posts, …) to connected clients. Consume it with the
 * `useEventStream` hook or a native `EventSource`.
 *
 * Optionally scope to a channel: `/api/stream?channel=session:<id>`.
 */
export const Route = createFileRoute('/api/stream')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url)
        const channel = url.searchParams.get('channel') ?? undefined
        const encoder = new TextEncoder()

        const stream = new ReadableStream({
          start(controller) {
            const write = (chunk: string) =>
              controller.enqueue(encoder.encode(chunk))

            const send = (event: string, data: unknown) =>
              write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)

            // Greet so the client knows the connection is live.
            send('ready', { channel: channel ?? null })

            const unsubscribe = subscribe((evt) => {
              if (channel && evt.channel && evt.channel !== channel) return
              send(evt.type, evt.data)
            })

            // Heartbeat comment keeps proxies from closing an idle connection.
            const heartbeat = setInterval(() => write(`: ping\n\n`), 25_000)

            request.signal.addEventListener('abort', () => {
              clearInterval(heartbeat)
              unsubscribe()
              controller.close()
            })
          },
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
          },
        })
      },
    },
  },
})

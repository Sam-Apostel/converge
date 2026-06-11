import { createFileRoute } from '@tanstack/react-router'

/** Railway health check target (see railway.json). */
export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: () => Response.json({ status: 'ok' }),
    },
  },
})

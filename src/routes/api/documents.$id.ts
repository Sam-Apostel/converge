import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'

import { db } from '#/db'
import { document } from '#/db/schema'

/**
 * Serve an uploaded document's bytes. Documents are immutable (replacing an
 * avatar uploads a new row), so responses are cacheable forever.
 */
export const Route = createFileRoute('/api/documents/$id')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const [row] = await db
          .select({
            mimeType: document.mimeType,
            size: document.size,
            data: document.data,
          })
          .from(document)
          .where(eq(document.id, params.id))
          .limit(1)

        if (!row) return new Response('Not found', { status: 404 })

        return new Response(new Uint8Array(row.data), {
          headers: {
            'content-type': row.mimeType,
            'content-length': String(row.size),
            'cache-control': 'public, max-age=31536000, immutable',
          },
        })
      },
    },
  },
})

import { createFileRoute } from '@tanstack/react-router'

import { db } from '#/db'
import { document } from '#/db/schema'
import { requireUser } from '#/lib/server-auth'

/** Upload kinds and what they accept. */
const KINDS = {
  avatar: { maxBytes: 2 * 1024 * 1024 },
  'project-screenshot': { maxBytes: 5 * 1024 * 1024 },
} as const

type DocumentKind = keyof typeof KINDS

const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])

/**
 * Document uploads — avatars and project screenshots.
 *
 * POST multipart/form-data with fields `file` and `kind`. Bytes are stored in
 * Postgres (see `document` in the domain schema) and served back from
 * `/api/documents/$id`. Responds with `{ id, url }` for the caller to persist
 * on the owning row (`user.image`, `project.screenshots`).
 */
export const Route = createFileRoute('/api/documents')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await requireUser(request)

        const form = await request.formData().catch(() => null)
        if (!form) {
          return new Response('Expected multipart/form-data', { status: 400 })
        }

        const kind = form.get('kind')
        if (typeof kind !== 'string' || !(kind in KINDS)) {
          return new Response(
            `Unknown kind — expected one of: ${Object.keys(KINDS).join(', ')}`,
            { status: 400 },
          )
        }

        const file = form.get('file')
        if (!(file instanceof File) || file.size === 0) {
          return new Response('Missing file', { status: 400 })
        }
        if (!IMAGE_TYPES.has(file.type)) {
          return new Response('Only image uploads are supported', {
            status: 415,
          })
        }
        const { maxBytes } = KINDS[kind as DocumentKind]
        if (file.size > maxBytes) {
          return new Response(
            `File too large — max ${Math.round(maxBytes / 1024 / 1024)}MB`,
            { status: 413 },
          )
        }

        const data = Buffer.from(await file.arrayBuffer())
        const [row] = await db
          .insert(document)
          .values({
            ownerId: user.id,
            kind,
            name: file.name || kind,
            mimeType: file.type,
            size: file.size,
            data,
          })
          .returning({ id: document.id })

        return Response.json(
          { id: row.id, url: `/api/documents/${row.id}` },
          { status: 201 },
        )
      },
    },
  },
})

import { createFileRoute } from '@tanstack/react-router'

import { searchAll } from '#/lib/queries/search'

/**
 * Global search API — backs the type-as-you-go client fetch on `/search`.
 *
 * `GET ?q=<query>` → a typed, ranked union across people, projects, sessions
 * and discussions (see `#/lib/queries/search`). Empty `q` returns `[]`.
 */
export const Route = createFileRoute('/api/search')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const q = url.searchParams.get('q') ?? ''
        const results = await searchAll({ data: q })
        return Response.json(results)
      },
    },
  },
})

import { createFileRoute } from '@tanstack/react-router'
import { and, asc, eq } from 'drizzle-orm'

import { db } from '#/db'
import { moment, user } from '#/db/schema'
import { publish } from '#/lib/events'
import { getSessionFromRequest } from '#/lib/server-auth'

/**
 * Moments API — backs the `momentsCollection` TanStack DB collection.
 * GET lists the viewer's moments for a session; POST bookmarks the current
 * slide; DELETE removes one. Each moment is scoped to the viewer.
 */

// TODO(auth): there's no signed-in user in the UI yet. Resolve the session when
// present, otherwise stand in with a stable demo user so "Your moments" has an
// owner. Swap this for `requireUser` once sign-in is wired up.
async function viewerId(request: Request): Promise<string | null> {
  const session = await getSessionFromRequest(request)
  if (session) return session.user.id
  const [first] = await db
    .select({ id: user.id })
    .from(user)
    .orderBy(asc(user.name))
    .limit(1)
  return first?.id ?? null
}

export const Route = createFileRoute('/api/moments')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const sessionId = new URL(request.url).searchParams.get('sessionId')
        if (!sessionId) return Response.json([], { status: 400 })
        const userId = await viewerId(request)
        if (!userId) return Response.json([])
        const rows = await db
          .select()
          .from(moment)
          .where(
            and(eq(moment.sessionId, sessionId), eq(moment.userId, userId)),
          )
          .orderBy(asc(moment.timestampMs))
        return Response.json(rows)
      },

      POST: async ({ request }) => {
        const userId = await viewerId(request)
        if (!userId) return new Response('No viewer', { status: 401 })
        const body = (await request.json()) as {
          sessionId: string
          timestampMs: number
          slideRef?: string | null
          transcriptSnippet?: string | null
          note?: string | null
        }
        const [row] = await db
          .insert(moment)
          .values({
            sessionId: body.sessionId,
            userId,
            timestampMs: body.timestampMs,
            slideRef: body.slideRef ?? null,
            transcriptSnippet: body.transcriptSnippet ?? null,
            note: body.note ?? null,
          })
          .returning()

        // Let other tabs/devices see the moment land in real time.
        publish({
          type: 'moment.created',
          channel: `session:${body.sessionId}`,
          data: row,
        })
        return Response.json(row, { status: 201 })
      },

      DELETE: async ({ request }) => {
        const id = new URL(request.url).searchParams.get('id')
        if (!id) return new Response('Missing id', { status: 400 })
        const userId = await viewerId(request)
        if (!userId) return new Response('No viewer', { status: 401 })
        await db
          .delete(moment)
          .where(and(eq(moment.id, id), eq(moment.userId, userId)))
        return new Response(null, { status: 204 })
      },
    },
  },
})

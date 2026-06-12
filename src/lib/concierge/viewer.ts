/**
 * Resolve the acting user for concierge requests (silo 7).
 *
 * The real gate is `requireUser` (`#/lib/server-auth`), but there's no signed-in
 * "me" in the UI yet, so — like `src/lib/queries/messages.ts` — we fall back to
 * the earliest-seeded user so the demo works out of the box.
 *
 * TODO(auth): once a UI session exists, replace the seed fallback with
 * `requireUser(request)` and drop the headers fallback.
 */
import { asc } from 'drizzle-orm'
import { getRequestHeaders } from '@tanstack/react-start/server'

import { db } from '#/db'
import { user } from '#/db/schema'
import { auth } from '#/lib/auth'

async function firstUserId(): Promise<string> {
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .orderBy(asc(user.createdAt))
    .limit(1)
  if (rows.length === 0) {
    throw new Error('No users in the database (run `bun run db:seed`)')
  }
  return rows[0].id
}

/**
 * Resolve the viewer id from a session. Pass explicit `headers` from an API
 * route's `Request`; omit them inside a server function (we read the ambient
 * request headers). Falls back to the earliest-seeded user.
 */
export async function resolveViewerId(headers?: Headers): Promise<string> {
  const session = await auth.api.getSession({
    headers: headers ?? new Headers(getRequestHeaders() as HeadersInit),
  })
  return session?.user.id ?? firstUserId()
}

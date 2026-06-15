import { getRequestHeaders } from '@tanstack/react-start/server'

import { auth } from '#/lib/auth'

/** The ambient request headers inside a server function. */
function ambientHeaders(): Headers {
  return new Headers(getRequestHeaders() as HeadersInit)
}

/** Resolve the session for an incoming server-route `Request` (or `null`). */
async function getSessionFromRequest(request: Request) {
  return auth.api.getSession({ headers: request.headers })
}

/**
 * Require an authenticated user for a server route. Throws a 401 `Response`
 * (which TanStack Start returns directly) when there is no session.
 */
export async function requireUser(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session) {
    throw new Response('Unauthorized', { status: 401 })
  }
  return session.user
}

/**
 * Resolve the acting user's id from the session. Pass explicit `headers` from
 * an API route's `Request`; omit them inside a server function (we read the
 * ambient request headers). Throws a 401 `Response` when there is no session.
 */
export async function requireUserId(headers?: Headers): Promise<string> {
  const session = await auth.api.getSession({
    headers: headers ?? ambientHeaders(),
  })
  if (!session) {
    throw new Response('Unauthorized', { status: 401 })
  }
  return session.user.id
}

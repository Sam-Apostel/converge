import { auth } from '#/lib/auth'

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

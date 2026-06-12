import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

import { auth } from '#/lib/auth'

/**
 * Resolve the current better-auth session on the server.
 *
 * Call from a route `beforeLoad`/`loader` or another server function. Returns
 * `null` when the request is unauthenticated.
 */
export const getSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const headers = new Headers(getRequestHeaders() as HeadersInit)
    return auth.api.getSession({ headers })
  },
)

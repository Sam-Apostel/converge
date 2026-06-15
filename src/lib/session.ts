import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

import { auth } from '#/lib/auth'

/**
 * The signed-in user, or `null` — for route `beforeLoad` auth gates.
 *
 * This lives in its own module (rather than `server-auth.ts`) so the only
 * server-only references sit inside the server-function handler, which the
 * bundler strips from the client. `server-auth.ts` exports plain helpers that
 * would otherwise pull its server imports into any client route that uses this.
 */
export const fetchSessionUser = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await auth.api.getSession({
      headers: new Headers(getRequestHeaders() as HeadersInit),
    })
    return session?.user ?? null
  },
)

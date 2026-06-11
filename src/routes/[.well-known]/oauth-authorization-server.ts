import { createFileRoute } from '@tanstack/react-router'
import { oAuthDiscoveryMetadata } from 'better-auth/plugins'

import { auth } from '#/lib/auth'

/**
 * RFC 8414 authorization-server metadata. Advertises the OAuth 2.1 endpoints
 * (authorize / token / register) that better-auth's MCP plugin serves under
 * `/api/auth`, so MCP clients can complete the auth code + PKCE flow.
 */
const handler = oAuthDiscoveryMetadata(auth)

export const Route = createFileRoute('/.well-known/oauth-authorization-server')({
  server: {
    handlers: {
      GET: ({ request }) => handler(request),
    },
  },
})

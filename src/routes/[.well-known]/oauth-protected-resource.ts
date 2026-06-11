import { createFileRoute } from '@tanstack/react-router'
import { oAuthProtectedResourceMetadata } from 'better-auth/plugins'

import { auth } from '#/lib/auth'

/**
 * RFC 9728 protected-resource metadata for the MCP endpoint. MCP clients are
 * pointed here by the `WWW-Authenticate` challenge on a 401 from `/mcp`; it
 * tells them which authorization server (this app) issues tokens.
 */
const handler = oAuthProtectedResourceMetadata(auth)

export const Route = createFileRoute('/.well-known/oauth-protected-resource')({
  server: {
    handlers: {
      GET: ({ request }) => handler(request),
    },
  },
})

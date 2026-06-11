import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createFileRoute } from '@tanstack/react-router'
import { withMcpAuth } from 'better-auth/plugins'

import { auth } from '#/lib/auth'
import { buildServer } from '#/mcp/server'

/**
 * Converge MCP endpoint (Streamable HTTP transport).
 *
 * Protected by better-auth's OAuth 2.1 authorization server via `withMcpAuth`:
 * unauthenticated requests get a `401` with the `WWW-Authenticate` challenge
 * pointing at the protected-resource metadata (see
 * `src/routes/.well-known/oauth-protected-resource.ts`). Authenticated requests
 * carry an `OAuthAccessToken` whose `userId` scopes every tool to that person.
 *
 * Runs statelessly (`sessionIdGenerator: undefined`) — a fresh server +
 * transport per request — so it deploys cleanly behind Railway with no sticky
 * sessions.
 */
const handler = withMcpAuth(auth, async (request, session) => {
  const server = buildServer(session.userId)
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  })
  await server.connect(transport)
  return transport.handleRequest(request)
})

export const Route = createFileRoute('/mcp')({
  server: {
    handlers: {
      GET: ({ request }) => handler(request),
      POST: ({ request }) => handler(request),
      DELETE: ({ request }) => handler(request),
    },
  },
})

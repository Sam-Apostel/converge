import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import { register as registerAdmin } from '#/mcp/tools/admin'
import { register as registerConference } from '#/mcp/tools/conference'
import { register as registerPeople } from '#/mcp/tools/people'
import { register as registerPersonal } from '#/mcp/tools/personal'
import { register as registerProject } from '#/mcp/tools/project'

/**
 * Build a per-request Converge MCP server scoped to an authenticated user.
 *
 * Tools are split across the four MCP surfaces from the product spec —
 * Conference, People, Project and Personal — each registered from its own
 * module in `src/mcp/tools/`. The `_app` suffixed tools return an interactive
 * UI resource (MCP Apps / SEP-1865); their plain counterparts return the same
 * data as JSON for hosts without MCP Apps support.
 *
 * Global super-admins (`isAdmin`) additionally get the Admin surface — write
 * access to the conference graph. It shares this one `/mcp` endpoint but is
 * registered conditionally, so it never appears in an ordinary attendee's tool
 * list. The admin flag is the authorization boundary, checked once here.
 */
export function buildServer(
  userId: string,
  { isAdmin = false }: { isAdmin?: boolean } = {},
): McpServer {
  const server = new McpServer({ name: 'converge', version: '0.1.0' })

  registerConference(server, userId)
  registerPeople(server, userId)
  registerProject(server, userId)
  registerPersonal(server, userId)

  if (isAdmin) registerAdmin(server, userId)

  return server
}

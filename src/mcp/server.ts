import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

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
 */
export function buildServer(userId: string): McpServer {
  const server = new McpServer({ name: 'converge', version: '0.1.0' })

  registerConference(server, userId)
  registerPeople(server, userId)
  registerProject(server, userId)
  registerPersonal(server, userId)

  return server
}

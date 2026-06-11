import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { desc, eq, ilike, or } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '#/db'
import {
  discussion,
  project,
  projectMember,
  user,
} from '#/db/schema'
import { projectsGridResource } from '#/mcp/apps'

import { text } from './util'

/** Top projects, most trending first. */
async function listProjects(limit = 50) {
  return db
    .select()
    .from(project)
    .orderBy(desc(project.trendingScore))
    .limit(limit)
}

/**
 * Project surface: the projects people are building, their teams and the
 * discussion threads attached to them. Public — nothing user-scoped.
 */
export function register(server: McpServer, _userId: string) {
  server.registerTool(
    'list_projects',
    {
      title: 'List projects',
      description: 'List projects people are building, most trending first.',
      inputSchema: {},
    },
    async () => text(await listProjects()),
  )

  server.registerTool(
    'list_projects_app',
    {
      title: 'List projects (interactive)',
      description:
        'List projects and render them as an interactive card grid (MCP Apps). Same data as list_projects.',
      inputSchema: {},
    },
    async () => {
      const projects = await listProjects()
      return {
        content: [
          projectsGridResource(projects),
          { type: 'text' as const, text: JSON.stringify(projects) },
        ],
      }
    },
  )

  server.registerTool(
    'get_project',
    {
      title: 'Get project',
      description: 'Get a single project with its owner and team members.',
      inputSchema: { projectId: z.string().describe('Project id') },
    },
    async ({ projectId }) => {
      const [row] = await db
        .select()
        .from(project)
        .where(eq(project.id, projectId))
        .limit(1)
      if (!row) return text(null)

      const [owner] = await db
        .select({ id: user.id, name: user.name, image: user.image })
        .from(user)
        .where(eq(user.id, row.ownerId))
        .limit(1)

      const members = await db
        .select({
          role: projectMember.role,
          id: user.id,
          name: user.name,
          image: user.image,
        })
        .from(projectMember)
        .innerJoin(user, eq(user.id, projectMember.userId))
        .where(eq(projectMember.projectId, projectId))

      return text({ ...row, owner: owner ?? null, members })
    },
  )

  server.registerTool(
    'search_projects',
    {
      title: 'Search projects',
      description:
        'Find projects by name, tagline, description or category. Returns JSON.',
      inputSchema: { query: z.string().default('').describe('Free-text search') },
    },
    async ({ query }) => {
      const like = `%${query}%`
      return text(
        await db
          .select()
          .from(project)
          .where(
            query
              ? or(
                  ilike(project.name, like),
                  ilike(project.tagline, like),
                  ilike(project.description, like),
                  ilike(project.category, like),
                )
              : undefined,
          )
          .orderBy(desc(project.trendingScore))
          .limit(50),
      )
    },
  )

  server.registerTool(
    'project_discussions',
    {
      title: 'Project discussions',
      description: 'List the discussion threads attached to a project.',
      inputSchema: { projectId: z.string().describe('Project id') },
    },
    async ({ projectId }) =>
      text(
        await db
          .select()
          .from(discussion)
          .where(eq(discussion.projectId, projectId))
          .orderBy(desc(discussion.updatedAt)),
      ),
  )
}

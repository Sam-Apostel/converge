import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { asc, desc, eq, ilike, or } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '#/db'
import {
  conference,
  conferenceSession,
  moment,
  profile,
  project,
  task,
  user,
} from '#/db/schema'
import type { Person } from '#/db/types'
import { peopleDirectoryResource } from '#/mcp/apps'

const text = (value: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
})

async function searchPeople(query: string): Promise<Array<Person>> {
  const like = `%${query}%`
  const rows = await db
    .select({ user, profile })
    .from(user)
    .leftJoin(profile, eq(profile.userId, user.id))
    .where(
      query
        ? or(
            ilike(user.name, like),
            ilike(profile.headline, like),
            ilike(profile.company, like),
            ilike(profile.currentFocus, like),
            ilike(profile.bio, like),
          )
        : undefined,
    )
    .limit(24)

  return rows.map((r) => ({
    id: r.user.id,
    name: r.user.name,
    image: r.user.image,
    profile: r.profile,
  }))
}

/**
 * Build a per-request Converge MCP server scoped to an authenticated user.
 *
 * Tools are grouped by the four MCP surfaces from the product spec:
 * Conference, People, Project and Personal. The `_app` suffixed tools return an
 * interactive UI resource (MCP Apps / SEP-1865); their plain counterparts
 * return the same data as JSON for hosts without MCP Apps support.
 */
export function buildServer(userId: string): McpServer {
  const server = new McpServer({ name: 'converge', version: '0.1.0' })

  /* ----------------------------- Conference ----------------------------- */

  server.registerTool(
    'list_conferences',
    {
      title: 'List conferences',
      description: 'List conferences available on Converge.',
      inputSchema: {},
    },
    async () => text(await db.select().from(conference).limit(50)),
  )

  server.registerTool(
    'list_sessions',
    {
      title: 'List sessions',
      description: 'List sessions (talks) for a conference, ordered by start time.',
      inputSchema: { conferenceId: z.string().describe('Conference id') },
    },
    async ({ conferenceId }) =>
      text(
        await db
          .select()
          .from(conferenceSession)
          .where(eq(conferenceSession.conferenceId, conferenceId))
          .orderBy(asc(conferenceSession.startsAt))
          .limit(200),
      ),
  )

  /* ------------------------------- People ------------------------------- */

  server.registerTool(
    'search_people',
    {
      title: 'Search people',
      description:
        'Find attendees by name, headline, company, current focus or bio. Returns JSON.',
      inputSchema: { query: z.string().default('').describe('Free-text search') },
    },
    async ({ query }) => text(await searchPeople(query)),
  )

  server.registerTool(
    'search_people_app',
    {
      title: 'Search people (interactive)',
      description:
        'Find attendees and render an interactive directory (MCP Apps). Same data as search_people.',
      inputSchema: { query: z.string().default('').describe('Free-text search') },
    },
    async ({ query }) => {
      const people = await searchPeople(query)
      return {
        content: [
          peopleDirectoryResource(people, query),
          { type: 'text' as const, text: JSON.stringify(people) },
        ],
      }
    },
  )

  server.registerTool(
    'get_profile',
    {
      title: 'Get profile',
      description: "Get a person's full Converge profile by user id.",
      inputSchema: { userId: z.string() },
    },
    async ({ userId: targetId }) => {
      const [row] = await db
        .select({ user, profile })
        .from(user)
        .leftJoin(profile, eq(profile.userId, user.id))
        .where(eq(user.id, targetId))
        .limit(1)
      return text(row ?? null)
    },
  )

  /* ------------------------------ Projects ------------------------------ */

  server.registerTool(
    'list_projects',
    {
      title: 'List projects',
      description: 'List projects people are building, most trending first.',
      inputSchema: {},
    },
    async () =>
      text(
        await db
          .select()
          .from(project)
          .orderBy(desc(project.trendingScore))
          .limit(50),
      ),
  )

  /* ------------------------------ Personal ------------------------------ */

  server.registerTool(
    'my_bookmarks',
    {
      title: 'My bookmarked moments',
      description: 'List the session moments the current user has bookmarked.',
      inputSchema: {},
    },
    async () =>
      text(
        await db
          .select()
          .from(moment)
          .where(eq(moment.userId, userId))
          .orderBy(desc(moment.createdAt))
          .limit(100),
      ),
  )

  server.registerTool(
    'my_tasks',
    {
      title: 'My tasks',
      description: 'List the current user\'s personal tasks.',
      inputSchema: {},
    },
    async () =>
      text(
        await db
          .select()
          .from(task)
          .where(eq(task.userId, userId))
          .orderBy(desc(task.createdAt)),
      ),
  )

  server.registerTool(
    'add_task',
    {
      title: 'Add task',
      description: 'Add a personal task for the current user.',
      inputSchema: { title: z.string().describe('Task title') },
    },
    async ({ title }) => {
      const [row] = await db
        .insert(task)
        .values({ userId, title })
        .returning()
      return text(row)
    },
  )

  return server
}

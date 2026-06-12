import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { and, eq, ilike, ne, or } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '#/db'
import { connection, profile, user } from '#/db/schema'
import type { Person } from '#/db/types'
import { peopleDirectoryResource } from '#/mcp/apps'

import { text } from './util'

/** Free-text people search across user name + profile fields. */
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

/** Count how many entries two (possibly null) arrays share. */
function overlap(a: Array<string> | null, b: Array<string> | null): number {
  if (!a?.length || !b?.length) return 0
  const set = new Set(a)
  return b.filter((x) => set.has(x)).length
}

/**
 * People surface: search, profiles, the attendee's network and topic-based
 * suggestions. `suggest_people` and `list_connections` are scoped to the
 * authenticated user.
 */
export function register(server: McpServer, userId: string) {
  server.registerTool(
    'search_people',
    {
      title: 'Search people',
      description:
        'Find attendees by name, headline, company, current focus or bio. Returns JSON.',
      inputSchema: {
        query: z.string().default('').describe('Free-text search'),
      },
    },
    async ({ query }) => text(await searchPeople(query)),
  )

  server.registerTool(
    'search_people_app',
    {
      title: 'Search people (interactive)',
      description:
        'Find attendees and render an interactive directory (MCP Apps). Same data as search_people.',
      inputSchema: {
        query: z.string().default('').describe('Free-text search'),
      },
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

  server.registerTool(
    'list_connections',
    {
      title: 'List connections',
      description:
        "List the current user's network. Defaults to accepted connections; pass status to filter.",
      inputSchema: {
        status: z
          .enum(['pending', 'accepted', 'all'])
          .default('accepted')
          .describe('Connection status to include'),
      },
    },
    async ({ status }) => {
      const rows = await db
        .select({ connection, user, profile })
        .from(connection)
        .innerJoin(user, eq(user.id, connection.contactId))
        .leftJoin(profile, eq(profile.userId, connection.contactId))
        .where(
          status === 'all'
            ? eq(connection.userId, userId)
            : and(eq(connection.userId, userId), eq(connection.status, status)),
        )

      return text(
        rows.map((r) => ({
          status: r.connection.status,
          note: r.connection.note,
          connectedAt: r.connection.createdAt,
          person: {
            id: r.user.id,
            name: r.user.name,
            image: r.user.image,
            profile: r.profile,
          } satisfies Person,
        })),
      )
    },
  )

  server.registerTool(
    'find_people',
    {
      title: 'Find people',
      description:
        'Find attendees by intent, topic or availability. Searches intents and interestedTopics fields, falling back to a general name/bio search.',
      inputSchema: {
        query: z
          .string()
          .default('')
          .describe('Intent, topic, skill or availability to search for'),
      },
    },
    async ({ query }) => {
      const like = `%${query}%`
      const rows = await db
        .select({ user, profile })
        .from(user)
        .leftJoin(profile, eq(profile.userId, user.id))
        .where(
          query
            ? or(
                ilike(user.name, like),
                ilike(profile.currentFocus, like),
                ilike(profile.bio, like),
                ilike(profile.headline, like),
              )
            : undefined,
        )
        .limit(24)

      return text(
        rows
          .filter((r) => {
            if (!query) return true
            const q = query.toLowerCase()
            const intents = r.profile?.intents ?? []
            const topics = r.profile?.interestedTopics ?? []
            if (
              intents.some((i) => i.toLowerCase().includes(q)) ||
              topics.some((t) => t.toLowerCase().includes(q))
            )
              return true
            return true
          })
          .map((r) => ({
            id: r.user.id,
            name: r.user.name,
            image: r.user.image,
            headline: r.profile?.headline ?? null,
            company: r.profile?.company ?? null,
            currentFocus: r.profile?.currentFocus ?? null,
            intents: r.profile?.intents ?? null,
            interestedTopics: r.profile?.interestedTopics ?? null,
          })),
      )
    },
  )

  server.registerTool(
    'suggest_people',
    {
      title: 'Suggest people',
      description:
        'Suggest attendees to meet, ranked by shared interested topics and intents with the current user.',
      inputSchema: {
        limit: z.number().int().min(1).max(50).default(10),
      },
    },
    async ({ limit }) => {
      const [me] = await db
        .select()
        .from(profile)
        .where(eq(profile.userId, userId))
        .limit(1)

      const rows = await db
        .select({ user, profile })
        .from(user)
        .innerJoin(profile, eq(profile.userId, user.id))
        .where(ne(user.id, userId))
        .limit(500)

      const scored = rows
        .map((r) => {
          const topics = overlap(
            me?.interestedTopics ?? null,
            r.profile.interestedTopics,
          )
          const intents = overlap(me?.intents ?? null, r.profile.intents)
          return {
            score: topics + intents,
            sharedTopics: (me?.interestedTopics ?? []).filter((t) =>
              (r.profile.interestedTopics ?? []).includes(t),
            ),
            sharedIntents: (me?.intents ?? []).filter((i) =>
              (r.profile.intents ?? []).includes(i),
            ),
            person: {
              id: r.user.id,
              name: r.user.name,
              image: r.user.image,
              profile: r.profile,
            } satisfies Person,
          }
        })
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)

      return text(scored)
    },
  )
}

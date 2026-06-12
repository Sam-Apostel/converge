import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { asc, desc, eq, inArray, or } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '#/db'
import {
  conferenceSession,
  message,
  moment,
  note,
  sessionSpeaker,
  task,
} from '#/db/schema'

import { text } from './util'

/** The current user's bookmarked moments, newest first. */
async function listMoments(userId: string) {
  return db
    .select()
    .from(moment)
    .where(eq(moment.userId, userId))
    .orderBy(desc(moment.createdAt))
    .limit(100)
}

/**
 * Personal surface: everything scoped to the authenticated user — their
 * bookmarked moments, notes, messages, derived schedule and tasks. Every query
 * here filters by `userId`.
 */
export function register(server: McpServer, userId: string) {
  server.registerTool(
    'my_bookmarks',
    {
      title: 'My bookmarked moments',
      description: 'List the session moments the current user has bookmarked.',
      inputSchema: {},
    },
    async () => text(await listMoments(userId)),
  )

  // Alias of my_bookmarks — "moments" is the product's name for bookmarks.
  server.registerTool(
    'my_moments',
    {
      title: 'My moments',
      description:
        'List the moments the current user has captured (alias of my_bookmarks).',
      inputSchema: {},
    },
    async () => text(await listMoments(userId)),
  )

  server.registerTool(
    'get_my_moments',
    {
      title: 'Get my moments',
      description:
        "Get the current user's saved moments — key highlights bookmarked during talks.",
      inputSchema: {},
    },
    async () => text(await listMoments(userId)),
  )

  server.registerTool(
    'my_notes',
    {
      title: 'My notes',
      description: 'List the notes the current user has taken, newest first.',
      inputSchema: {},
    },
    async () =>
      text(
        await db
          .select()
          .from(note)
          .where(eq(note.userId, userId))
          .orderBy(desc(note.createdAt))
          .limit(200),
      ),
  )

  server.registerTool(
    'my_messages',
    {
      title: 'My messages',
      description:
        'List direct messages the current user has sent or received, newest first.',
      inputSchema: {},
    },
    async () =>
      text(
        await db
          .select()
          .from(message)
          .where(
            or(eq(message.fromUserId, userId), eq(message.toUserId, userId)),
          )
          .orderBy(desc(message.createdAt))
          .limit(200),
      ),
  )

  server.registerTool(
    'my_schedule',
    {
      title: 'My schedule',
      description:
        "The sessions on the current user's radar — talks they speak at, bookmarked a moment in, or took a note on — ordered by start time.",
      inputSchema: {},
    },
    async () => {
      const [bookmarked, noted, speaking] = await Promise.all([
        db
          .selectDistinct({ sessionId: moment.sessionId })
          .from(moment)
          .where(eq(moment.userId, userId)),
        db
          .selectDistinct({ sessionId: note.sessionId })
          .from(note)
          .where(eq(note.userId, userId)),
        db
          .selectDistinct({ sessionId: sessionSpeaker.sessionId })
          .from(sessionSpeaker)
          .where(eq(sessionSpeaker.userId, userId)),
      ])

      const sessionIds = [
        ...new Set(
          [...bookmarked, ...noted, ...speaking]
            .map((r) => r.sessionId)
            .filter((id): id is string => Boolean(id)),
        ),
      ]
      if (sessionIds.length === 0) return text([])

      return text(
        await db
          .select()
          .from(conferenceSession)
          .where(inArray(conferenceSession.id, sessionIds))
          .orderBy(asc(conferenceSession.startsAt)),
      )
    },
  )

  server.registerTool(
    'my_tasks',
    {
      title: 'My tasks',
      description: "List the current user's personal tasks.",
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
      const [row] = await db.insert(task).values({ userId, title }).returning()
      return text(row)
    },
  )
}

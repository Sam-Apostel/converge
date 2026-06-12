import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq, isNull, or } from 'drizzle-orm'

import { db } from '#/db'
import { connection, message, profile, user } from '#/db/schema'
import {
  buildThreads,
  type DirectoryPerson,
  type MessageRow,
  type MessagesData,
} from '#/components/messages/types'

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Resolve the viewing user. There's no signed-in "me" yet, so we fall back to
 * the earliest-seeded user (stable across reloads). Pass `?me=<id>` to preview
 * the inbox of anyone in the seed.
 *
 * TODO(auth): replace with the session user from `getSessionFromRequest`.
 */
export async function resolveViewer(me?: string): Promise<string> {
  if (me) return me
  const [first] = await db
    .select({ id: user.id })
    .from(user)
    .orderBy(asc(user.createdAt))
    .limit(1)
  return first.id
}

/** The full attendee directory, keyed for avatar + name lookups. */
async function loadDirectory(): Promise<Array<DirectoryPerson>> {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      image: user.image,
      handle: profile.handle,
    })
    .from(user)
    .leftJoin(profile, eq(profile.userId, user.id))
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    image: r.image,
    handle: r.handle,
    online: false,
  }))
}

function serialize(m: typeof message.$inferSelect): MessageRow {
  return {
    id: m.id,
    fromUserId: m.fromUserId,
    toUserId: m.toUserId,
    body: m.body,
    readAt: m.readAt ? m.readAt.toISOString() : null,
    createdAt: m.createdAt.toISOString(),
  }
}

/** Every message involving the viewer, oldest first. */
export async function messagesForViewer(
  me: string,
): Promise<Array<MessageRow>> {
  const rows = await db
    .select()
    .from(message)
    .where(or(eq(message.fromUserId, me), eq(message.toUserId, me)))
    .orderBy(asc(message.createdAt))
  return rows.map(serialize)
}

/** A single conversation between the viewer and one other person, oldest first. */
export async function conversationBetween(
  me: string,
  other: string,
): Promise<Array<MessageRow>> {
  const rows = await db
    .select()
    .from(message)
    .where(
      or(
        and(eq(message.fromUserId, me), eq(message.toUserId, other)),
        and(eq(message.fromUserId, other), eq(message.toUserId, me)),
      ),
    )
    .orderBy(asc(message.createdAt))
  return rows.map(serialize)
}

/** Mark every message from `other` to `me` as read. Returns rows touched. */
export async function markThreadRead(
  me: string,
  other: string,
): Promise<number> {
  const rows = await db
    .update(message)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(message.fromUserId, other),
        eq(message.toUserId, me),
        isNull(message.readAt),
      ),
    )
    .returning({ id: message.id })
  return rows.length
}

/* ------------------------------------------------------------------ */
/* Server functions (SSR loaders)                                      */
/* ------------------------------------------------------------------ */

/**
 * Everything the `/messages` screen needs on first paint: the viewer, the
 * directory, their conversation threads, and pending/accepted connections.
 */
export const getMessagesData = createServerFn({ method: 'GET' })
  .validator((d: { me?: string } | undefined) => d ?? {})
  .handler(async ({ data }): Promise<MessagesData> => {
    const me = await resolveViewer(data.me)
    const people = await loadDirectory()
    const peopleById = new Map(people.map((p) => [p.id, p]))

    const messages = await messagesForViewer(me)
    const threads = buildThreads(messages, peopleById, me)

    // Incoming requests waiting on me to accept.
    const pendingRows = await db
      .select({
        id: connection.id,
        fromId: connection.userId,
        note: connection.note,
      })
      .from(connection)
      .where(
        and(eq(connection.contactId, me), eq(connection.status, 'pending')),
      )
    const pending = pendingRows
      .map((r) => ({
        id: r.id,
        from: peopleById.get(r.fromId),
        note: r.note,
      }))
      .filter(
        (p): p is { id: string; from: DirectoryPerson; note: string | null } =>
          Boolean(p.from),
      )

    // The contacts I've already connected with.
    const acceptedRows = await db
      .select({ contactId: connection.contactId })
      .from(connection)
      .where(and(eq(connection.userId, me), eq(connection.status, 'accepted')))
    const accepted = acceptedRows
      .map((r) => peopleById.get(r.contactId))
      .filter((p): p is DirectoryPerson => Boolean(p))

    return { me, people, threads, connections: { pending, accepted } }
  })

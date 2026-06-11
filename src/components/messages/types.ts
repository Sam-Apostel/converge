/**
 * Shared, client-safe types + pure helpers for the Messages screen.
 *
 * Lives under `components/` (not `lib/queries`) so both the server query and the
 * client components can import it without dragging `#/db` into the bundle.
 */

/** A direct message, serialized for transport (dates as ISO strings). */
export type MessageRow = {
  id: string
  fromUserId: string
  toUserId: string
  body: string
  readAt: string | null
  createdAt: string
}

/** A person in the directory — enough to render an avatar + name everywhere. */
export type DirectoryPerson = {
  id: string
  name: string
  image: string | null
  handle: string | null
  online: boolean
}

/** One conversation, grouped by the other participant. */
export type Thread = {
  otherId: string
  other: DirectoryPerson
  lastMessage: MessageRow
  unread: number
}

/** An incoming connection request awaiting accept. */
export type PendingRequest = {
  id: string
  from: DirectoryPerson
  note: string | null
}

export type Connections = {
  pending: Array<PendingRequest>
  accepted: Array<DirectoryPerson>
}

/** Everything the messages page loads up front. */
export type MessagesData = {
  me: string
  people: Array<DirectoryPerson>
  threads: Array<Thread>
  connections: Connections
}

/**
 * Group a flat list of messages (all involving `me`) into threads keyed by the
 * other participant. Expects `messages` sorted ascending by `createdAt`.
 */
export function buildThreads(
  messages: Array<MessageRow>,
  peopleById: Map<string, DirectoryPerson>,
  me: string,
): Array<Thread> {
  const byOther = new Map<string, { last: MessageRow; unread: number }>()

  for (const m of messages) {
    const otherId = m.fromUserId === me ? m.toUserId : m.fromUserId
    const entry = byOther.get(otherId) ?? { last: m, unread: 0 }
    // messages arrive in ascending order, so the latest seen wins
    entry.last = m
    if (m.toUserId === me && m.fromUserId === otherId && m.readAt === null) {
      entry.unread += 1
    }
    byOther.set(otherId, entry)
  }

  const threads: Array<Thread> = []
  for (const [otherId, { last, unread }] of byOther) {
    const other = peopleById.get(otherId)
    if (!other) continue
    threads.push({ otherId, other, lastMessage: last, unread })
  }

  return threads.sort(
    (a, b) =>
      new Date(b.lastMessage.createdAt).getTime() -
      new Date(a.lastMessage.createdAt).getTime(),
  )
}

/** Filter the viewer's messages down to a single conversation, oldest first. */
export function conversationOf(
  messages: Array<MessageRow>,
  me: string,
  otherId: string,
): Array<MessageRow> {
  return messages
    .filter(
      (m) =>
        (m.fromUserId === me && m.toUserId === otherId) ||
        (m.fromUserId === otherId && m.toUserId === me),
    )
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
}

/** Compact relative time: "now", "4m", "2h", "3d", else "Mar 3". */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'now'
  if (min < 60) return `${min}m`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

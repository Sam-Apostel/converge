# Silo 4 — Messages & connections (the network that remains)

> Read [`README.md`](./README.md) first. **No design mock** for this screen —
> build it natively in the design system (study any §3/§5 card + list patterns in
> `design/Converge.dc.html` for the look). "The conference ends. The network
> remains."

Direct messages + the connection graph that outlives the event.

## Owns (write only here)

- `src/routes/_app/messages.tsx` — the messages screen (replace placeholder)
- `src/components/messages/*` — thread list, conversation, connection cards
- `src/lib/queries/messages.ts` — threads + a single conversation
- `src/routes/api/messages.ts` — POST a message; GET a conversation
- `src/routes/api/connections.ts` — POST request / accept
- `src/db-collections/messages.ts` — optimistic message collection

## Build

Two-pane layout inside the shell:

- **Left — conversations list:** group `message` rows by the other participant
  into threads. Each row: `Avatar` (+ presence `dot`), name, last-message snippet,
  relative time, and an unread indicator (lime dot / count `Badge`) when
  `readAt is null`. Above it, a **Connections** strip: pending `connection`
  requests (status `pending`) with **Accept** (`Button variant="lime" size="sm"`)
  and accepted contacts as an `AvatarStack`.
- **Right — conversation:** the selected thread's messages as bubbles (mine =
  `bg-ink text-white` right-aligned; theirs = `Card surface="inner"` left), a
  composer (`bg-pillow` input + lime send `Button`). Sending appends optimistically
  via the messages collection → `POST /api/messages` (`{ toUserId, body }`), and
  marks the thread read.

**Realtime:** publish a `message.created` event (`#/lib/events`) on a per-user
channel; the list/conversation subscribe via `useEventStream` to update unread +
append incoming messages live.

## Data

Tables: `message` (`fromUserId, toUserId, body, readAt`), `connection`
(`userId, contactId, status, note`). Join `user`/`profile` for names + avatars.
The seed creates messages + connections — render real threads. Since there's no
signed-in "me" yet, pick a stable demo viewer (e.g. the first seeded user, or a
`?me=<id>` param) and leave a `// TODO(auth)` to swap in the real session user.

## Don't

Don't touch the shell, `ui/`, the `db-collections/index.ts` barrel, or
`lib/queries.ts`. No schema changes.

## Done when

`/messages` shows conversation threads + connections from real data, sending a
message appends optimistically and persists, unread state works; typecheck +
build pass; PR opened.

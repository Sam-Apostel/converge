# Silo 2 — Discussions: questions that don't disappear

> Read [`README.md`](./README.md) first. Design source: **§3** of
> `design/Converge.dc.html` (lines ~352–445).

A question becomes a thread with a life of its own, and the best ones end as a
real meetup: **Question → Answer → Follow-up → Community → Meetup**.

## Owns (write only here)

- `src/routes/_app/discussions.tsx` — index (replace placeholder)
- `src/routes/_app/discussions/$id.tsx` — a single thread (new route)
- `src/components/discussion/*` — lifecycle rail, thread, meetup card, channels
- `src/lib/queries/discussions.ts` — list + thread queries
- `src/routes/api/discussions.ts` — POST a reply / upvote (optional this pass)

## Build

**Lifecycle rail** — a horizontal `Card` with five stages connected by gradient
connectors: `Q` (dark) → `A` (slate) → `↳ Follow-up` → `··· Community` →
`◎ Meetup` (lime). The connector into Meetup fades to lime. Pull the exact chip
styles from the design.

**Index (`discussions.tsx`)** — left: the featured thread (see below). Right rail:
a **Topic channels** card (`#react-server-components 214`, `#ai-tooling`,
`#react-native`, `#hiring` — the active one on `bg-inner`) and a **Trending
question** card. Channels map to `discussion.topic`; counts can be derived or
shown from data.

**Thread (`$id.tsx` and the featured thread component)** — render a `discussion`
with its `discussionPost` rows as the Q → A → follow-up → community spine:
- The root **question** (`question` row) with a `VoteControl` (up/48/down) and
  author (`Avatar` + name + "Replay.io · asked live").
- A left-bordered spine (`border-l-2`) of replies. The speaker's answer gets a
  lime `SPEAKER` `Badge`. Follow-ups and community replies follow. A community
  reply shows an `AvatarStack` + "+12 replies in this thread".
- The **meetup outcome** at the bottom: a `Spotlight` (dark + lime glow) — "THIS
  THREAD BECAME A MEETUP", title ("Coffee: RSC data-fetching patterns"), time +
  place (mono), an `AvatarStack` of attendees (`border="#15172a"`), and a lime
  **Join** button. The seed creates exactly this discussion (`title` "Coffee: RSC
  data-fetching patterns", `topic` react-server-components, linked to the RSC
  session + question) — render the real row + its posts.

## Data

Tables: `discussion` (`title, topic, sessionId, projectId, questionId,
createdById`), `discussionPost` (`discussionId, authorId, parentId, body`),
`question`, `answer`. Join authors to `user`/`profile` for avatars + names. Add
your queries in `src/lib/queries/discussions.ts`. SSR via loaders.

## Don't

Don't touch the shell, `ui/`, or `lib/queries.ts`. No schema changes.

## Done when

`/discussions` shows the lifecycle rail, the seeded RSC thread with its meetup
card, and topic channels; `/discussions/<id>` renders a thread; typecheck + build
pass; PR opened.

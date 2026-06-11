# Silo 1 — Session: the operating system for a talk

> Read [`README.md`](./README.md) first. Design source: **§2** of
> `design/Converge.dc.html` (lines ~206–351) — read those inline styles.

The hero, interactive screen. A live talk with a one-tap **Bookmark this slide**
that drops the current slide into a personal Moments rail.

## Owns (write only here)

- `src/routes/_app/sessions/$sessionId.tsx` — the session screen (replace placeholder)
- `src/routes/_app/sessions/index.tsx` — redesign the schedule list to the system
- `src/components/session/*` — new presentational pieces
- `src/lib/queries/sessions.ts` — session detail + list queries
- `src/routes/api/moments.ts` — POST create / DELETE a moment
- `src/db-collections/moments.ts` — the moments collection (optimistic)

## Build

**Schedule (`sessions/index.tsx`)** — list `conferenceSession` ordered by
`startsAt`, grouped/labelled by time, with room + track + speaker `Avatar`. Each
row links to `/sessions/$sessionId`. (A `listSessions` server fn already exists in
`src/lib/queries.ts` returning `{id,title,abstract,track,startsAt,endsAt,roomName,
speakerId,speakerName}` — reuse it via import, or add a richer one in your file.)

**Session screen (`$sessionId.tsx`)** — two-column inside one big rounded card
(`1.55fr / 1fr`):

- **Top bar + live progress** — breadcrumb (`Sessions / <title>`, room on the
  right), then a progress track: a dark "Talk" segment (`flex:8`) + a striped
  "Q&A" segment (`flex:2`, `repeating-linear-gradient`), with a pulsing lime
  playhead dot (`LiveDot` style) positioned along it. Legend below: "Talk · live
  now" + "Q&A · 09:50–09:55". Drive the playhead from a `playhead` state that
  advances on each capture (see the design's `slides()` + `renderVals()`).
- **Left — the talk:** title, speaker (`Avatar` + name + role), and **speaker
  social icons** (GitHub / X / website) read from `profile.socials`
  (`{github,x,website}`) rendered as the soft icon buttons from the design (NOT a
  follow button). Then the **live slide**: a `Thumb` (diagonal hatch) with a
  "Slide N — topic" chip (top-left), an "on stage now" lime-dot chip (top-right),
  and the slide-meta chip bottom-left. **The Bookmark button is NOT on the slide.**
  - **Capture dock** (design update — see `design/Converge.dc.html` ~lines
    261–271 and `design/screenshots/01-capture-dock.png`): directly **below** the
    slide, a dark container — use **`Spotlight`** — with the lime radial glow,
    holding a pulsing `LiveDot` + mono **`CAPTURE · {time}`** and **"Keep this
    slide on your timeline"** on the left, and the lime **`★ Bookmark this slide`**
    button (`Button variant="lime"`) on the right.
  - Below the dock: a tabbed strip (Live questions / Discussion / Notes) showing
    the session's `question` rows with `VoteControl`.
- **Right — Moments rail** (`bg-inner`): "Your moments" + a lime count `Badge`,
  empty state, then a **2-col grid of moment thumbnails** — each a `Thumb` with a
  lime `★ {time}` chip, slide number, topic, and a remove ×. Below: "In the room
  for you" related people (Avatar + name + Connect) and a related-project card.

**Capture interaction (the point):** tapping Bookmark appends the current slide
to the moments collection **optimistically**, advances the playhead, and shows a
toast ("Moment saved to your rail", `animate-toast-in`). Moments persist via
`POST /api/moments` (`{ sessionId, timestampMs, slideRef, note, transcriptSnippet }`)
→ `moment` table; removal via DELETE. Use a `db-collections/moments.ts` collection
(`queryCollectionOptions`, see `src/db-collections/index.ts` for the pattern) so
the grid updates instantly. New moments animate in with `animate-moment-in`.
Publish a `moment.created` event (`#/lib/events`) on the channel `session:<id>` so
the rail can update live across tabs (optional polish).

Seed data: the React Summit RSC talk has seeded `question`/`answer` rows and a
related project — render the real rows.

## Don't

Don't touch the shell, the `ui/` primitives, or `lib/queries.ts`. Don't change
the schema (the `moment` table already fits).

## Done when

`/sessions` lists talks, `/sessions/<id>` renders the talk OS, tapping Bookmark
adds a moment to the rail (optimistic + persisted) and advances the playhead;
`bun run typecheck` + `bun run build` pass; PR opened.

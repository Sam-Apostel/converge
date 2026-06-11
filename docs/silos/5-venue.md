# Silo 5 — Venue & the conference billboard

> Read [`README.md`](./README.md) first. **No design mock** for this screen —
> build it natively in the design system. The brief: "where ideas and people are
> the stars, not sponsor logos."

Rooms + walking times, and a **billboard** of what's trending at the conference.

## Owns (write only here)

- `src/routes/_app/venue.tsx` — the venue screen (replace placeholder)
- `src/components/venue/*` — room map/list, billboard tiles
- `src/lib/queries/venue.ts` — rooms, what's-on-now, billboard data

## Build

- **Rooms** — list/grid of `room` rows for the conference (name, floor,
  capacity), each showing **what's on now / next** (join `conferenceSession` by
  `roomId` + time) with the speaker `Avatar`. A simple schematic "map" is plenty:
  position rooms on a soft `Card` canvas; `room.location` (`{lat,lng}` jsonb) can
  drive layout if present, otherwise lay them out in a sensible grid by floor.
- **Walking time** — a small helper that turns a room (or room→room) into an
  estimate ("4 min walk"); a deterministic stand-in is fine — surface it as the
  lime-dot chip used elsewhere (`◎ 4 min walk`). Show "your next session is in
  {room} · {walk}".
- **The billboard** — a hero band (`Spotlight` is a good base) cycling/tiling:
  **trending projects** (top `project` by `trendingScore` — reuse `ProjectCard`
  or a compact tile), **active discussions** (`discussion` rows), **upcoming
  meetups**, and **featured people** (`PersonCard`/`Avatar`). This is the
  "stars are people and ideas" moment — make it feel like a venue screen.

## Data

Tables: `room`, `conferenceSession`, `project`, `discussion`, `profile`/`user`.
Put queries in `src/lib/queries/venue.ts` (e.g. `getVenue()` →
`{ rooms, nextByRoom, billboard }`). SSR via a loader. The seed has rooms,
sessions, trending projects and a discussion to populate all of this.

## Don't

Don't touch the shell, `ui/`, or `lib/queries.ts`. No schema changes. No new
routes (the `venue` route already exists). Reuse `ProjectCard`/`PersonCard` rather
than re-styling cards.

## Done when

`/venue` shows rooms with what's-on + walking times and a populated billboard from
real data; typecheck + build pass; PR opened.

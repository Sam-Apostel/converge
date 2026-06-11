# Silo 8 — Global search

> Read [`README.md`](./README.md) first. **No design mock** — build it natively
> in the design system. The Home command bar ("ask anything") hints at this;
> search is the literal version.

One search across **people, projects, sessions and discussions**, with typed,
grouped results.

## Owns (write only here)

- `src/routes/_app/search.tsx` — the search screen / command palette (new route)
- `src/routes/api/search.ts` — the search endpoint
- `src/components/search/*` — input, grouped result rows
- `src/lib/queries/search.ts` — the cross-entity query

## Build

**Query (`lib/queries/search.ts` + `api/search.ts`)** — a `search(q)` that runs
`ILIKE '%q%'` (v1 — keep it simple; Postgres full-text/`tsvector` is a fine later
upgrade) across:
- **people** — `user.name`, `profile.headline`, `profile.company`,
  `profile.interestedTopics`, `profile.intents`
- **projects** — `project.name`, `project.tagline`, `project.category`,
  `project.techStack`
- **sessions** — `conferenceSession.title`, `abstract`, `track`
- **discussions** — `discussion.title`, `topic`

Return a typed, ranked union: `{ type: 'person'|'project'|'session'|'discussion',
id, title, subtitle, href }[]`, capped per type. Expose it as both a server fn
(for the page loader / SSR) and/or the API route.

**UI (`search.tsx`)** — a command-palette feel on the canvas: a big `bg-pillow`
search input at top (reuse the Home command-bar styling), then results **grouped
by type** with a `Mono` section label per group and rows built from the `ui`
primitives (`Avatar` for people/projects, mono time for sessions), each linking
to its detail route (`/people/$userId`, `/projects/$slug`,
`/sessions/$sessionId`, `/discussions/$id`). Empty state + a few suggested
queries. Debounce input; update results as you type (client fetch to the API
route, or a server-fn call).

## Coordination

**Do not touch the shell** (`_app.tsx`) — the header already *hints* at ⌘K but
wiring that global trigger is a separate, single coordinated edit we'll do after
this lands. Ship the `/search` route reachable by URL + a nav/`Link`; leave a
`// TODO: wire ⌘K in the shell` note in your PR description.

## Don't

Don't touch the shell, `ui/`, `lib/queries.ts`, or other silos' files. No schema
changes.

## Done when

`/search` returns grouped, typed results across all four entities from real data
and links to detail pages; `bun run typecheck` + `bun run build` pass; PR opened.

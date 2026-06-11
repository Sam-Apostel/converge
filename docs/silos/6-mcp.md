# Silo 6 — MCP platform expansion

> Read [`README.md`](./README.md) first. Backend only — no UI, no routes.

Every major Converge object should be reachable over MCP so external agents can
act on behalf of an attendee. The server already runs at `/mcp` (Streamable HTTP,
OAuth-protected, scoped to a `userId`). Expand the toolset and add interactive
**MCP Apps** surfaces.

## Owns (write only here)

- `src/mcp/server.ts` — tool registration (`buildServer(userId)`)
- `src/mcp/apps.ts` — MCP Apps UI resources (`@mcp-ui/server` `createUIResource`)
- `src/mcp/tools/*` — new: split tools into per-surface modules

## What exists

`buildServer(userId)` registers: `list_conferences`, `list_sessions`,
`search_people` (+ `search_people_app` interactive), `get_profile`,
`list_projects`, `my_bookmarks`, `my_tasks`, `add_task`. `apps.ts` has
`peopleDirectoryResource(...)` showing the `_app` pattern (a `_app` tool returns a
`createUIResource(...)` UI; the plain tool returns JSON).

## Build

**Refactor** the inline tool registrations into `src/mcp/tools/{conference,people,
project,personal}.ts`, each exporting a `register(server, userId)` that
`server.registerTool(...)`. `server.ts` becomes thin (build + call each register).

**Round out the four surfaces** (all scoped to `userId` where personal; query the
existing tables):

- **Conference** — `get_session`, `list_rooms`, `get_schedule` (by track/time),
  `list_speakers`.
- **People** — `get_profile` (have it), `list_connections`, `suggest_people`
  (by shared `interestedTopics`/`intents`).
- **Project** — `get_project`, `search_projects`, `project_discussions`.
- **Personal** — `my_moments` (alias bookmarks), `my_notes`, `my_messages`,
  `my_schedule`, plus the existing task tools.

**MCP Apps** — add `_app` variants that return an interactive UI via
`createUIResource` (mirror `peopleDirectoryResource`): at least
`list_projects_app` (project cards grid) and `session_app` (a session with its
moments/Q&A). Keep a plain JSON tool beside every `_app` tool. Escape user content
(`apps.ts` already has an `escapeHtml`). Validate inputs with `zod` like the
existing tools.

## Conventions

- Each tool returns `{ content: [{ type: 'text', text: JSON.stringify(...) }] }`
  (see the `text()` helper in `server.ts`); `_app` tools additionally return the
  `createUIResource(...)` object in `content`.
- Use the shared `db` (`#/db`) + drizzle. Personal tools must filter by `userId`.
- Don't change `src/routes/mcp.ts` (the transport/OAuth wrapper) or the schema.

## Verify

`bun run typecheck` + `bun run build`. Optionally smoke-test by POSTing a
`tools/list` JSON-RPC request to `/mcp` (it will 401 without a token — that's the
OAuth guard working; full end-to-end needs an MCP client + the OAuth flow).

## Done when

Tools are split into `src/mcp/tools/*`, the four surfaces are filled out, at least
two new `_app` interactive tools exist with JSON counterparts; typecheck + build
pass; PR opened.

# Converge — agent guide

Converge is a **people-first conference companion**. People and the projects
they build are the primary objects; sessions, moments, questions and discussions
are woven around them into a persistent knowledge graph.

Read `README.md` for the stack and `AGENTS.md` for TanStack Intent skill
mappings. Features and their acceptance criteria live as **GitHub epics + sub
issues** — pick one up there.

## Conventions

- **Runtime is Bun.** Use `bun`/`bunx`, never `npm`/`npx`. Path alias `#/*` → `src/*`.
- **Data flow:**
  - Server reads in route loaders → `createServerFn` in `src/lib/queries.ts`.
  - Client reactive state / optimistic writes → TanStack DB collections in
    `src/db-collections/`, backed by REST routes under `src/routes/api/`.
  - Realtime → publish to the event bus (`src/lib/events.ts`); clients consume
    via `useEventStream` (`src/hooks/use-event-stream.ts`).
- **Never import `#/db` (node-postgres) into client components.** Use a server
  function or an API route. The drizzle schema *types* (`#/db/types`) are safe.
- **Auth:** server session via `requireUser` (`src/lib/server-auth.ts`);
  client via `useSession`/`authClient` (`src/lib/auth-client.ts`).
- **Schema changes:** edit `src/db/domain-schema.ts`, then
  `bun run db:generate && bun run db:migrate`. For auth changes, edit
  `src/lib/auth.ts` then `bun run auth:generate` (do not hand-edit
  `src/db/auth-schema.ts`).
- **MCP:** add tools in `src/mcp/server.ts`. For an interactive surface, add a
  `*_app` variant returning `createUIResource(...)` (see `src/mcp/apps.ts`) and
  keep a plain JSON variant. Tools are scoped to the authenticated `userId`.
- **UI:** KendoReact free components + Tailwind v4. Reach for the
  `make-interfaces-feel-better` and `transitions-dev` skills for polish; use
  `border-beam` sparingly for special states.

## Verify before done

```bash
bun run typecheck
bun run build
```

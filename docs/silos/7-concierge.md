# Silo 7 — AI Concierge

> Read [`README.md`](./README.md) first. Design source: **§1, Direction C**
> ("Glass concierge") of `design/Converge.dc.html` for the look — frosted glass
> frame around an opaque neumorphic surface, lime-forward.

A streaming chat that guides attendees and can **act on Converge data** — "who
should I meet?", "what did I miss?", "find AI engineers into manufacturing",
"summarize today's talks".

## Owns (write only here)

- `src/routes/_app/concierge.tsx` — the chat screen (replace the placeholder)
- `src/routes/api/concierge.ts` — streaming chat endpoint (tool-use loop)
- `src/components/concierge/*` — message list, composer, tool-result cards
- `src/lib/concierge/*` — the model client + tool definitions
- `package.json` — **you are the only silo allowed to add a dependency** (the
  Anthropic SDK). Add it cleanly; don't reformat unrelated lines.
- `.env.example` — add `ANTHROPIC_API_KEY=` (and document it)

## Model

Use **Claude via the Anthropic API** (`@anthropic-ai/sdk`) — this is a
Claude-centric project. Default to the latest model id **`claude-opus-4-8`**
(swap to `claude-sonnet-4-6` if you want cheaper/faster). Needs
`ANTHROPIC_API_KEY` (server-side only — never expose it to the client). The app
already deploys on Railway; the key gets set there + in local `.env.local`.

## Build

**Endpoint (`api/concierge.ts`)** — a server route that accepts the chat
messages, calls Claude with **tool use** + **streaming**, runs the tool-use loop
(execute the tool, feed the result back, continue), and streams text deltas to
the client (SSE / a `ReadableStream` `text/event-stream`, like
`src/routes/api/stream.ts`). Gate it with `requireUser` once auth is live; for
now run it open with a `// TODO(auth)`.

**Tools** — give the model a small set of typed tools that wrap the existing
query layer. **Do NOT edit `src/mcp/*`** (that's the merged MCP silo) and don't
call the OAuth-protected `/mcp` endpoint over HTTP. Instead define thin tool
functions in `src/lib/concierge/tools.ts` that reuse Converge's data (drizzle via
`#/db`, or import server-side query helpers). Start with: `search_people(query)`,
`list_sessions()`, `get_schedule()`, `list_projects()`, `get_profile(userId)`,
`my_schedule()`. Each returns compact JSON the model can reason over. (The MCP
server in `src/mcp/` is a good reference for what each should return.)

**UI (`concierge.tsx`)** — replace the static placeholder with a real chat:
- The §1-C glass frame (frosted outer, opaque `#f6f7fc` inner) as the container.
- Example-prompt chips (the ones already in the placeholder), an input dock
  (`bg-pillow`, lime send), and a streamed message list.
- Render **tool results inline** with the existing components — e.g. a
  `search_people` result as a row of `Avatar` + name, a session as a row — so
  answers are interactive, not just text. Reuse `PersonCard`/`ProjectCard` or
  compact variants.
- Stream tokens as they arrive (`animate`-friendly), show a thinking state.

## Don't

Don't touch the shell, `ui/`, `src/mcp/*`, or other silos' files. Keep the API
key server-only. Keep tool functions read-only for now (no destructive actions
from chat without a confirm step).

## Done when

`/concierge` streams a real Claude conversation that can call the tools and
render results inline; `ANTHROPIC_API_KEY` documented in `.env.example`;
`bun run typecheck` + `bun run build` pass; PR opened. (Without a key set the
screen should degrade gracefully — show the prompt UI + a "set ANTHROPIC_API_KEY"
notice rather than crash.)

# Silo 7 — AI Concierge (TanStack AI, BYOK)

> Read [`README.md`](./README.md) first. Design source: **§1, Direction C**
> ("Glass concierge") of `design/Converge.dc.html` for the look.

A streaming chat that guides attendees and can **act on Converge data** — "who
should I meet?", "what did I miss?", "find AI engineers into manufacturing",
"summarize today's talks".

## The model strategy (read carefully)

Use **[TanStack AI](https://tanstack.com/ai)** (`@tanstack/ai`) — provider-agnostic,
streaming, tool-calling, with React bindings. Two modes:

- **Local, for dev:** the **`@tanstack/ai-ollama`** adapter against a local Ollama
  server (`OLLAMA_BASE_URL`, default `http://localhost:11434`; a default model via
  `CONCIERGE_DEV_MODEL`, e.g. `llama3.1`). No key, no cost. This is the fallback
  whenever a user hasn't configured their own provider.
- **Bring-your-own, for everyone else:** each user picks a **provider + model +
  API key** in settings; the server resolves the matching adapter per request
  (`@tanstack/ai-openai` / `-anthropic` / `-openrouter` / `-ollama`).

Confirm exact adapter package names + versions on npm before installing.

## Owns (write only here)

- `src/routes/_app/concierge.tsx` — the chat screen (replace the placeholder)
- `src/routes/api/concierge.ts` — streaming chat endpoint (resolves the user's
  provider, runs the tool-use loop, streams back)
- `src/components/concierge/*` — message list, composer, tool-result cards
- `src/lib/concierge/*` — provider resolution + tool definitions + key crypto
- `src/routes/_app/settings.tsx` — **new** settings screen for the AI provider /
  model / key (don't edit `profile.tsx`; link to `/settings` from the concierge —
  wiring it into the avatar menu is a later coordinated shell edit)
- `src/db/domain-schema.ts` — **a schema change is allowed now** (silos merged):
  add a small **`userAiSettings`** table (`userId` PK → `provider`, `model`,
  `apiKeyEncrypted`, `baseUrl`, timestamps). Then `bun run db:generate` +
  `bun run db:migrate` and commit the migration.
- `package.json` — you're the only silo adding deps (TanStack AI + adapters)
- `.env.example` — add `OLLAMA_BASE_URL`, `CONCIERGE_DEV_MODEL`, and
  `CONCIERGE_KEY_SECRET` (for encrypting stored keys; can default to
  `BETTER_AUTH_SECRET`)

## Build

**Provider resolution (`lib/concierge/provider.ts`)** — given the current user,
load their `userAiSettings`; if present, build the matching TanStack AI adapter
with their decrypted key + model; else fall back to the local Ollama adapter.
**API keys are secrets:** encrypt at rest (AES-256-GCM with `CONCIERGE_KEY_SECRET`),
decrypt only server-side, never send a key (or another user's) to the client.

**Endpoint (`api/concierge.ts`)** — accept the chat messages, run TanStack AI's
streaming chat with the resolved provider + the tools, and stream tokens/tool
events to the client. Gate with `requireUser` (there's no UI session yet — use a
`// TODO(auth)` stand-in viewer for now).

**Tools** — typed, **read-only** tools that wrap Converge data. **Do NOT edit
`src/mcp/*`** and don't call the OAuth-protected `/mcp` over HTTP — define thin
functions in `src/lib/concierge/tools.ts` over `#/db` (the MCP server in
`src/mcp/` is a good reference for shapes): `search_people`, `list_sessions`,
`get_schedule`, `list_projects`, `get_profile`, `my_schedule`.

**Settings UI (`settings.tsx`)** — a form to choose provider (Ollama / OpenAI /
Anthropic / OpenRouter), enter a model id, and paste a key (write-only field —
show "key set", never render the stored key back). Persists to `userAiSettings`
via a server fn / API route you own. Include a "test connection" affordance.

**Chat UI (`concierge.tsx`)** — the §1-C glass frame (frosted outer, opaque
`#f6f7fc` inner). Use `@tanstack/ai-react`'s `useChat`. Example-prompt chips, an
input dock (`bg-pillow`, lime send), streamed messages, and **tool results
rendered inline** with the existing components (a `search_people` result as
`Avatar` rows, a session as a row) so answers are interactive. If no provider is
configured **and** no local model is reachable, degrade gracefully — show the UI
+ a "configure a model in Settings" notice, not a crash.

## Don't

Don't touch the shell, `ui/`, `src/mcp/*`, `profile.tsx`, or other silos' files.
Keep keys server-only + encrypted. Keep chat tools read-only (no destructive
actions without an explicit confirm step).

## Done when

`/concierge` streams a real conversation (local Ollama out of the box) that can
call the tools and render results inline; `/settings` lets a user set their own
provider/model/key and the endpoint uses it; keys are encrypted at rest;
`bun run typecheck` + `bun run build` pass; PR opened.

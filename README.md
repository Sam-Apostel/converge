# Converge

**The conference companion that makes the people around you visible.**

> *People before sessions. Projects before companies. Moments instead of photos. Questions become conversations.*

**▶ [Live demo: converge.sams.land](https://converge.sams.land)** · best viewed on a phone (or a narrow ~390px window)

![Converge home — natural-language search, next session, people to meet, trending projects](docs/home.png)

---

## The problem

You're at a conference surrounded by exactly the right people — but you'll never find them. The name badge says your company, not what you're building. You scramble to photograph slides instead of listening. Great questions get answered once and vanish. The parallel talk you skipped might have had your next co-founder in it.

## What Converge does

**Discover** — Browse attendees by what they're building and why they're here, not just where they work. Filter by intent: hiring, open to co-founders, learning AI, meeting maintainers. An AI guide answers "who should I meet?" with real names from the room.

**Capture** — One tap saves a timestamp bookmark during any talk. No more broken focus, no more blurry slide photos. Replay from that exact moment later. Your bookmark rail shows who else captured the same passage — people who resonated with the same idea are your warmest possible introduction.

**Continue** — Questions don't die when the presenter walks off stage. Every question becomes a persistent thread: question → speaker answer → community follow-up → real-world meetup. The best conversations at a conference happen in the hallway after the talk. Converge makes that scale.

**Explore** — See what people are actually building, not where they work. Projects surface with their builders, tech stack, and what kind of help they're looking for. A live billboard shows trending projects, active discussions, and available attendees — ambient context for the whole room.

---

## Key features

| Feature | What it does |
|---------|-------------|
| **AI search** | Natural-language queries over real conference data — people, sessions, projects, moments |
| **Intent profiles** | Attendees tag themselves: hiring, open to work, co-founders, learning AI, meeting maintainers |
| **Moment capture** | One-tap timestamp bookmark during a live talk; replay from that second later |
| **Shared moments** | See who else bookmarked the same passage — instant warm introduction |
| **Persistent Q&A** | Questions survive the talk and grow into threaded discussions with speaker badges |
| **Live billboard** | Full-screen `/billboard` route for venue displays — trending, active, available |
| **MCP platform** | Every object exposed over MCP with OAuth; external agents can act on behalf of attendees |

---

## Stack

| Concern        | Choice                                                            |
| -------------- | ----------------------------------------------------------------- |
| Runtime / PM   | [Bun](https://bun.com)                                            |
| Framework      | [TanStack Start](https://tanstack.com/start) (Vite, React 19)     |
| Client data    | [TanStack DB](https://tanstack.com/db) + TanStack Query           |
| Database       | PostgreSQL via [Drizzle ORM](https://orm.drizzle.team)            |
| Auth           | [better-auth](https://better-auth.com) — passkeys, GitHub         |
| Realtime       | Server-Sent Events (`/api/stream`)                                |
| Agent platform | MCP server with OAuth + MCP Apps (`/mcp`)                         |
| UI             | [KendoReact](https://www.telerik.com/kendo-react-ui) (free) + Tailwind v4 |
| Hosting        | [Railway](https://railway.com) (config-as-code)                  |

---

## Run it locally (for judges)

A full walkthrough from a clean machine to a seeded app with a working AI
concierge. Should take about 5 minutes; the only required external piece is
PostgreSQL. **No API keys are needed** — the concierge falls back to a local
Ollama model, and you can sign in with email + password.

### 1. Prerequisites

| Tool | Why | Install |
| ---- | --- | ------- |
| **[Bun](https://bun.com)** ≥ 1.1 | Runtime + package manager (this project does **not** use npm) | `curl -fsSL https://bun.sh/install \| bash` |
| **PostgreSQL** 14+ | The database | Docker (below) or a local install |
| **[Ollama](https://ollama.com)** | Powers the AI concierge with **no API key** | `brew install ollama` / [download](https://ollama.com/download) — *optional but recommended* |

### 2. Install dependencies

```bash
bun install
```

### 3. Start PostgreSQL

The fastest path is Docker — this matches the default connection string in
`.env.example`:

```bash
docker run --name converge-pg -d \
  -p 5432:5432 \
  -e POSTGRES_USER=username \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=converge \
  postgres:16
```

Already have Postgres? Just create a `converge` database and note the
connection string for the next step.

### 4. Configure the environment

```bash
cp .env.example .env.local
```

Open `.env.local`. The only variables you **must** set:

| Variable | What to put |
| -------- | ----------- |
| `DATABASE_URL` | Connection string. The Docker command above ⇒ `postgresql://username:password@localhost:5432/converge` |
| `BETTER_AUTH_SECRET` | Any random string. Generate one: `bunx @better-auth/cli@1.6.16 secret` |

Everything else is **optional** and has sensible defaults:

| Variable | Default | When you'd change it |
| -------- | ------- | -------------------- |
| `BETTER_AUTH_URL` | `http://localhost:3000` | Only if you run on a different host/port |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | *(empty → GitHub sign-in disabled)* | Only if you want the "Sign in with GitHub" button. Email + password and passkeys work without it |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | If Ollama runs elsewhere |
| `CONCIERGE_DEV_MODEL` | `llama3.1` | To use a different local model |
| `CONCIERGE_KEY_SECRET` | falls back to `BETTER_AUTH_SECRET` | Separate key for encrypting per-user provider keys at rest |

### 5. Create the schema and migrate

```bash
bun run auth:generate   # regenerate the better-auth tables (src/db/auth-schema.ts)
bun run db:generate     # build a Drizzle migration from the schema
bun run db:migrate      # apply it to Postgres
```

### 6. Seed the demo data

```bash
bun run db:seed
```

This loads the **React Summit + JSNation 2026** demo set: 17 attendees with
intent profiles, two co-located Amsterdam conferences, rooms, ~15 talks with
speakers/abstracts/Q&A/moments, projects with tech stacks, discussion threads,
and connections. It's **idempotent** — re-running truncates and reseeds, so you
always get a clean, deterministic dataset to demo against.

### 7. (Optional) Set up the AI concierge with Ollama

The concierge works with **zero API keys** by talking to a local Ollama server.
In a separate terminal:

```bash
ollama serve              # start the local server (often already running)
ollama pull llama3.1      # pull the default model (~4.7 GB)
```

The app pings `{OLLAMA_BASE_URL}/api/tags` to confirm Ollama is reachable; if it
isn't, the rest of the app still works — only the concierge chat is affected.

> Prefer a hosted model? Sign in, open **Settings → AI**, and paste an
> Anthropic / OpenAI / OpenRouter key. Keys are encrypted (AES-256-GCM) at rest
> and scoped per user.

### 8. Run it

```bash
bun run dev               # http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000), sign up with any email +
password (no verification needed locally), and you're in. The live venue
display lives at [/billboard](http://localhost:3000/billboard).

> **Converge is designed mobile-first.** For the intended experience, narrow
> your browser to a phone-width viewport (~390px) or use the device toolbar in
> your browser's dev tools.

### Troubleshooting

| Symptom | Fix |
| ------- | --- |
| Concierge chat errors, rest of the app is fine | Ollama isn't reachable. Run `ollama serve` and `ollama pull llama3.1`, or add a hosted key in **Settings → AI**. |
| `db:migrate` / `db:seed` can't connect | Postgres isn't up or `DATABASE_URL` is wrong. Check `docker ps` and that the string matches the container credentials. |
| `port 5432 already in use` | Another Postgres is running. Stop it, or map a different host port (`-p 5433:5432`) and update `DATABASE_URL`. |
| `command not found: bun` | Bun isn't on your `PATH`. Restart the shell or `source ~/.bashrc` / `~/.zshrc` after install. |
| Seed data looks stale | `bun run db:seed` is idempotent — re-run it to truncate and reload a clean dataset. |

### Scripts

| Script                  | Does                                                       |
| ----------------------- | ---------------------------------------------------------- |
| `bun run dev`           | Dev server                                                 |
| `bun run build`         | Production build (Nitro output in `.output/`)              |
| `bun run start`         | Run the production server with Bun                         |
| `bun run typecheck`     | `tsc --noEmit`                                             |
| `bun run db:seed`       | Seed with React Summit + JSNation 2026 demo data           |
| `bun run auth:generate` | Regenerate `src/db/auth-schema.ts` from `src/lib/auth.ts`  |
| `bun run db:generate`   | Create a Drizzle migration from the schema                 |
| `bun run db:migrate`    | Apply migrations                                           |
| `bun run db:studio`     | Drizzle Studio                                             |

---

## Project layout

```
src/
├── routes/                      # file-based routes
│   ├── _app.tsx                 # app shell (nav + bottom tab bar)
│   ├── _app/                    # Home, Sessions, People, Projects, Discussions, …
│   ├── billboard.tsx            # standalone full-screen /billboard (no shell)
│   ├── login.tsx                # email/social/passkey sign-in
│   ├── mcp.ts                   # MCP server endpoint (Streamable HTTP + OAuth)
│   ├── [.well-known]/           # OAuth 2.1 discovery metadata
│   └── api/                     # auth, projects, people, sessions, moments, questions, connections, stream
├── db/
│   ├── auth-schema.ts           # generated by better-auth
│   ├── domain-schema.ts         # Converge domain (people, projects, sessions, moments, Q&A, …)
│   └── schema.ts                # barrel (drizzle-kit reads this)
├── db-collections/              # TanStack DB collections (optimistic client state)
├── mcp/                         # MCP server, tools, and MCP Apps UI resources
├── lib/                         # auth, queries, events, navigation
├── hooks/                       # useEventStream (SSE)
└── components/                  # shared UI
```

---

## MCP platform

Every major object is exposed over MCP at `/mcp` (Streamable HTTP). The server is the **OAuth 2.1 resource server**; better-auth is the **authorization server** (`/.well-known/oauth-*` advertise the endpoints). Tools are scoped to the authenticated user. `*_app` tools return an interactive MCP Apps UI (SEP-1865) via `@mcp-ui/server`; plain variants return JSON.

### Endpoints

| Path | Purpose |
| ---- | ------- |
| `POST/GET/DELETE /mcp` | Streamable HTTP MCP transport (stateless — a fresh server per request) |
| `GET /.well-known/oauth-protected-resource` | RFC 9728 resource metadata (points clients at the auth server) |
| `GET /.well-known/oauth-authorization-server` | RFC 8414 authorization-server metadata (token / authorize / DCR endpoints) |

Unauthenticated requests get a `401` with a `WWW-Authenticate` challenge pointing at the protected-resource metadata, so spec-compliant clients can discover the auth server and run the OAuth flow (Dynamic Client Registration + PKCE) automatically.

### Tools

Scoped to the signed-in user. Each `*_app` tool has a plain JSON twin.

| Surface | Tools |
| ------- | ----- |
| Conference | `list_conferences`, `list_sessions`, `get_session`, `get_schedule`, `list_rooms`, `list_speakers`, `get_session_summary`, `get_moment_matches`, `session_app` |
| People | `search_people`, `find_people`, `suggest_people`, `get_profile`, `list_connections`, `search_people_app` |
| Projects | `list_projects`, `search_projects`, `get_project`, `get_trending_projects`, `project_discussions`, `list_projects_app` |
| Personal | `my_schedule`, `my_moments`, `get_my_moments`, `my_bookmarks`, `my_notes`, `my_messages`, `my_tasks`, `add_task` |

### Client config

Most MCP clients don't speak OAuth + Streamable HTTP directly yet — bridge with [`mcp-remote`](https://www.npmjs.com/package/mcp-remote), which runs the browser OAuth flow and proxies stdio↔HTTP. For Claude Desktop (`claude_desktop_config.json`), Cursor, or any client that reads an `mcpServers` map:

```jsonc
{
  "mcpServers": {
    "converge": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://converge.sams.land/mcp"]
      // local dev: replace the URL with http://localhost:3000/mcp
    }
  }
}
```

On first connect a browser window opens to sign in to Converge and authorize the client; the token is cached for subsequent calls. Clients that support remote MCP servers natively can instead point straight at `https://converge.sams.land/mcp`.

---

## Deployment (Railway)

`railway.json` defines the build/deploy. Provision a PostgreSQL plugin and set `DATABASE_URL=${{Postgres.DATABASE_URL}}` plus the auth env vars. Migrations run on container start.

---

## Agent tooling

This repo ships two installed skills under `.claude/skills/` (`make-interfaces-feel-better`, `transitions-dev`) and uses [`border-beam`](https://beam.jakubantalik.com) sparingly for special states. `AGENTS.md` carries the TanStack Intent skill mappings.

---

## License

[MIT](LICENSE) © Sam Apostel

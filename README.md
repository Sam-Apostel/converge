# Converge

**The conference companion that makes the people around you visible.**

> *People before sessions. Projects before companies. Moments instead of photos. Questions become conversations.*

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

## Getting started

```bash
bun install
cp .env.example .env.local        # then fill in the values

# generate the better-auth tables, create a migration, and apply it
bun run auth:generate             # regenerates src/db/auth-schema.ts
bun run db:generate               # drizzle migration from the schema
bun run db:migrate                # apply to Postgres
bun run db:seed                   # seed with React Summit + JSNation demo data

bun run dev                       # http://localhost:3000
```

You need a Postgres database. Locally:
`docker run -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=converge postgres`.

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

---

## Deployment (Railway)

`railway.json` defines the build/deploy. Provision a PostgreSQL plugin and set `DATABASE_URL=${{Postgres.DATABASE_URL}}` plus the auth env vars. Migrations run on container start.

---

## Agent tooling

This repo ships two installed skills under `.claude/skills/` (`make-interfaces-feel-better`, `transitions-dev`) and uses [`border-beam`](https://beam.jakubantalik.com) sparingly for special states. `AGENTS.md` carries the TanStack Intent skill mappings.

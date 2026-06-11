# Converge — parallel work briefs

Each file in this folder is a **self-contained silo** of remaining feature work.
They were carved so that **no two silos write the same file** — pick one up in
its own branch and it won't collide with the others.

**Read this file first, then your silo brief.** Everything here is shared
context every silo needs.

---

## Ground rules

- **Runtime is Bun.** `bun` / `bunx`, never npm/npx. Path alias `#/*` → `src/*`.
- **Only write the files your brief lists under "Owns".** Everything else is
  frozen — consume it, don't edit it. If you think you genuinely need to change a
  frozen file, stop and flag it in your PR instead (it's a coordination point).
- **No schema changes.** Every table you need already exists in
  `src/db/domain-schema.ts`. Don't run `db:generate`/`db:migrate`.
- Match the existing code's style, comment density, and idioms.

## Verify before you open a PR

```bash
bun run generate-routes   # only if you added a route file
bun run typecheck
bun run build
```

Then commit on a branch `feat/<silo>` and open a PR against `main`.
`routeTree.gen.ts` is generated — if two silos touch it, it's resolved by
re-running `bun run generate-routes` after merge (non-semantic).

---

## The design system (frozen)

Soft periwinkle canvas · **Geist / Geist Mono** · neumorphic white cards +
frosted glass · **lime `#99ff00` for live/delight accents only (fills, never
muddy text)** · near-black ink `#13141d`. The pixel-level source is
[`design/Converge.dc.html`](../../design/Converge.dc.html) — your brief points
you at the relevant section. Read the inline styles directly; don't screenshot.

### Tailwind tokens (in `src/styles.css`)

Colors: `ink`, `ink-2`, `slate`, `mist`, `muted`, `faint`, `lime`, `lime-deep`,
`canvas`, `surface`, `inner`, `pillow`, `tag`, `line`.
Shadows: `shadow-card`, `shadow-card-lg`, `shadow-card-hover`, `shadow-soft`,
`shadow-lime`. Fonts: `font-sans` (Geist), `font-mono` (Geist Mono).
Animations: `animate-live-pulse`, `animate-moment-in`, `animate-toast-in`,
`animate-caret`. Use `tabular-nums` for numbers.

## Unified components (frozen — import, don't re-build)

From `#/components/ui` (`src/components/ui/`):

| Component | Key props |
|-----------|-----------|
| `Avatar` | `name` (derives initials + stable palette), `size`, `shape: 'circle'\|'squircle'`, `dot: true\|'online'\|'offline'`, `ring: 0–100`, `ringLabel`, `border`, `src`, `initials`, `bg`, `ink` |
| `AvatarStack` | `people: {name?,initials?,src?}[]`, `size`, `max`, `border`, `overflowBg`, `overflowInk` |
| `Card` | `surface: 'white'\|'inner'\|'dark'\|'glass'` |
| `Spotlight` | dark lime-glow hero. `glow: 'top-right'\|'right'`, `style` (override `background` gradient) |
| `Button` | `variant: 'dark'\|'lime'\|'soft'\|'glass'`, `size: 'sm'\|'md'`. `buttonClass()` for styling links |
| `Pill` | nav/filter chip. `active`, `tone: 'dark'\|'lime'`, `elevated` |
| `Tag` | `variant: 'neutral'\|'lime'\|'strike'\|'soft'` |
| `Badge` | `tone: 'lime'\|'lime-soft'\|'dark'\|'ghost'`, `mono` |
| `Mono` | uppercase eyebrow. `tone: 'faint'\|'slate'\|'lime'\|'mute'\|'ghost'` (color via `tone`, never a text-color class) |
| `LiveDot` | `size` |
| `Thumb` | tinted slide/cover placeholder. `tint`, `height`, `radius`, children overlay |
| `VoteControl` | `count`, `downvote` |

Also: `paletteFor(seed)`, `initialsOf(name)` from `#/components/ui`.
Feature cards: `PersonCard` (`#/components/person-card`), `ProjectCard`
(`#/components/project-card`).

## Data layer

- **Server reads** → `createServerFn({ method: 'GET' }).handler(...)`. Put new
  ones in **your own** `src/lib/queries/<silo>.ts` (do NOT edit `src/lib/queries.ts`).
- **Client reactive state / optimistic writes** → a TanStack DB collection in
  **your own** `src/db-collections/<silo>.ts`, backed by a REST route under
  `src/routes/api/`. Import your collection directly from its file (don't touch
  the `db-collections/index.ts` barrel). TanStack DB is **client-only** — read it
  in components, not in SSR loaders.
- **Realtime** → `publish({ type, data, channel? })` from `#/lib/events`; clients
  consume with `useEventStream({ channel, onEvent })` (`#/hooks/use-event-stream`).
- **Never import `#/db` into a client component.** Use a server fn or API route.
  Row types are safe via `#/db/types` (`Person`, `Project`, `ConferenceSession`,
  `Moment`, `Question`, `Discussion`, `Message`, `Task`, …).
- **Auth** (deferred but available): `requireUser(request)` /
  `getSessionFromRequest` (`#/lib/server-auth`) in API routes. There's no signed-in
  user in the UI yet — where the design implies "me", use a sensible stand-in and
  leave a `// TODO(auth)` (see `#/lib/demo` for the match%/presence pattern).

### Tables (all exist in `src/db/domain-schema.ts`)

`conference`, `conferenceMember`, `room`, `profile`, `project`, `projectMember`,
`conferenceSession`, `sessionSpeaker`, `moment`, `note`, `question`, `answer`,
`discussion`, `discussionPost`, `message`, `connection`, `task`.
`profile` carries: `handle`, `headline`, `company`, `title`, `bio`, `location`,
`intents[]`, `currentFocus`, `interestedTopics[]`, `notInterestedTopics[]`,
`availability`, `socials`.

### Seeded data

`src/scripts/seed.ts` populates two co-located Amsterdam conferences (JSNation +
React Summit): profiles, projects, talks, **moments, notes, Q&A, discussions,
messages and connections**. So your screen will have real rows to render. Reseed
with `DATABASE_URL='<public url>' bun run db:seed`.

## Route file shapes

```ts
// API route — src/routes/api/<name>.ts
import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/api/<name>')({
  server: { handlers: { GET: async ({ request }) => Response.json(...) } },
})

// Page route — src/routes/_app/<name>.tsx  (wrapped by the glass shell)
export const Route = createFileRoute('/_app/<name>')({
  loader: () => myServerFn(),
  component: MyPage,
})
```

Page-level data uses a `loader` calling a server fn (SSR-safe). Keep page headers
consistent with People/Projects: an `h1.text-2xl.font-semibold.tracking-[-0.02em]`
+ a `p.text-[14.5px].text-mist` subtitle.

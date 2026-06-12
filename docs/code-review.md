# Converge — code review & technical analysis

_June 2026 · produced alongside the codebase-cleanup PR (oxlint/oxfmt, knip,
design-token unification). Line numbers reference the cleanup branch._

## Executive summary

The architecture is sound and pleasantly small: server functions for SSR
reads, per-id cached TanStack DB collections with optimistic writes, an
in-process event bus for realtime, and a correctly OAuth-scoped MCP server.
The session live screen, the batched query hydrators (`loadThreads`,
`loadQuestions`), and the vite client-stub plugin (which provably keeps the
DB driver and concierge crypto out of the client bundle) are the strongest
code in the repo.

The problems cluster in three places:

1. **An unfinished migration to session-derived auth.** Half the API surface
   derives the actor from the session (`requireUser`); the other half trusts
   the request (`me`, `fromUserId`, channel query params) or silently falls
   back to "the first seeded user". Everything in §1 is a consequence.
2. **Copy-paste surfaces that have already drifted** — three viewer-resolution
   helpers with three security postures, question hydration in three shapes,
   the same MCP tool name returning different data via `/mcp` vs the
   concierge, three Connect buttons with three state machines.
3. **A UI kit with too-rigid variant APIs**, evidenced by ~63 `!important`
   escape hatches at call sites.

None of this is structural; the highest-leverage fixes are one shared
viewer/auth module, one shared read/serializer module, and `cva` +
`tailwind-merge` in the UI kit.

---

## 1. Security — deploy blockers

These are all live on any deployed instance. The code marks most of them
`TODO(auth)`, so they're known demo shortcuts — listed here as the ship
gate.

| # | Severity | Where | Issue |
|---|----------|-------|-------|
| S1 | Critical | `src/routes/api/messages.ts` | Full IDOR: `GET ?me=<id>` reads anyone's inbox, `POST {fromUserId}` sends as anyone, `PATCH {me}` marks anyone's threads read. Actor comes from the request, never the session. |
| S2 | Critical | `src/routes/api/connections.ts` | Same IDOR: create/accept/reject connections as any user via body-supplied `me`. The POST-accept path also inserts a one-way "accepted" mirror with no existence check — you can self-connect to anyone. |
| S3 | Critical | `src/routes/api/stream.ts` + `src/lib/events.ts` | SSE endpoint is unauthenticated and trusts the `channel` query param. `GET /api/stream?channel=user:<victim>` streams the victim's DMs (full bodies are published to `user:<id>` channels). A subscription with **no** channel receives *every* event, including all users' messages and moments. |
| S4 | Critical | `src/lib/concierge/viewer.ts:35` + `src/lib/concierge/settings.ts` | `resolveViewerId` falls back to `firstUserId()`. Anonymous callers run the concierge tool loop as the earliest-seeded user (their stored provider key gets used and billed) and can read/overwrite that user's AI settings. |
| S5 | Critical | `src/lib/concierge/settings.ts:124-156` (`testAiConnection`) | Decrypts the **stored** provider key when no key is supplied and sends a request to a caller-controlled `baseUrl` — a key-exfiltration / SSRF oracle, anonymous when combined with S4. Never pair a stored key with a request-supplied base URL; pin base URLs for hosted providers. |
| S6 | High | `src/mcp/tools/people.ts:87` (`get_profile`) | Returns the raw `profile` row for any userId — all columns, including any future private ones. The concierge twin projects an allow-list; the MCP version should too. |
| S7 | High | `src/lib/concierge/crypto.ts:21-35` | Fixed scrypt salt + key derived from `BETTER_AUTH_SECRET` fallback. One leaked secret then compromises two trust domains (sessions *and* stored provider keys). Require a dedicated secret; store a per-record random salt (`salt.iv.tag.ct`). |
| S8 | Medium | `src/routes/api/concierge.ts:40` | Client-supplied message history is fed to the model with no schema validation, size cap, or rate limit — an uncapped LLM/tool-loop cost vector (anonymous until S4 is fixed). |
| S9 | Medium | `src/routes/api/{people,sessions,search}.ts`, `projects.ts` GET | Anonymous reads of the full directory (socials, intents, location) while sibling routes require auth. If intentional, document it; the split currently looks accidental. |
| S10 | Medium | all POST/PATCH API routes | Bodies are `request.json() as T` with no validation; malformed input becomes unhandled 500s (`projects.ts:38`, FK violations in `messages.ts`, `tasks.ts`). One shared `parseBody(request, zodSchema)` → 400 fixes the class. |
| S11 | Low | `src/lib/auth.ts:34` | GitHub provider registered with `?? ''` credentials when env is missing — conditionally register instead. |
| S12 | Low | `src/scripts/seed.ts:859` | Seed truncates `user` CASCADE with no environment guard. Refuse on `NODE_ENV=production` or require `--force`. |

**Positive findings:** MCP tool authorization is genuinely correct —
`withMcpAuth` extracts `userId` from the OAuth token, `buildServer(userId)`
closes over it, and no tool argument can override it. OAuth discovery routes
(RFC 9728/8414) are correctly wired. The vite stub plugin
(`vite.config.ts:43-100`) keeps `pg`, `#/db`, and the concierge crypto out of
the client bundle with environment-scoped resolution; the encryption key
cannot reach the client.

## 2. Correctness bugs

| # | Severity | Where | Issue |
|---|----------|-------|-------|
| B1 | High | `src/routes/_app/index.tsx:202` | `{window.location.origin}/mcp` evaluated during render on an SSR route — breaks server rendering of the empty-state home. Resolve in an effect with an SSR-safe fallback (see `add-to-claude-button.tsx:30-37` for the sanctioned pattern). |
| B2 | High | `src/routes/api/questions.$id.vote.ts` | Vote toggle is select-then-act across three statements with no transaction: concurrent unvotes drift `upvotes` negative; concurrent first votes 500 on the unique index. Wrap in `db.transaction`, decide direction from `onConflictDoNothing().returning()` / `delete().returning()`, recount or `greatest(0, …)`. |
| B3 | High | `src/routes/api/questions.$id.promote.ts` | Promote is non-atomic and the idempotency check is racy — two concurrent promotes create two discussions. Claim the row with a guarded update (`… where promoted_discussion_id is null`) inside a transaction. |
| B4 | High | `src/hooks/use-event-stream.ts:48` + `src/routes/_app/messages.tsx:79` | The hook lists `onEvent` in effect deps; Messages passes an inline closure, so every render tears down and reopens the `EventSource`, and each incoming message triggers invalidate → render → reconnect churn. Store the callback in a ref; depend on `channel` only. |
| B5 | Medium | `src/lib/queries.ts:111` | "Next session" has no `startsAt >= now` filter — after the conference starts it forever shows the first keynote. The speaker join also picks an arbitrary speaker for multi-speaker sessions. |
| B6 | Medium | `src/lib/queries.ts:195` (`listSessions`) | `limit(200)` applies to speaker-join fanned-out rows: duplicate sessions for multi-speaker talks and nondeterministic truncation (no secondary sort). Same fan-out-then-limit bug in `suggestPeopleToMeet` (`queries.ts:57`). |
| B7 | Medium | `src/lib/queries/profiles.ts:60` | Connection state only checks the outgoing direction (incoming pending renders as `none` → duplicate requests) and maps `rejected` to `pending` forever. Schema comment, PATCH route, and reader disagree on the status enum — reconcile in one exported union. |
| B8 | Medium | `src/lib/queries/discussions.ts:298` | "Most active" orders by `updatedAt`, but inserting a post never bumps the parent — activity ordering is actually creation ordering. |
| B9 | Medium | `src/routes/_app/index.tsx:125` | Concierge composer: Enter never submits (the handler only `preventDefault`s Shift+Enter — backwards), while the ↵/⌘ kbd hint advertises the shortcut. Keyboard users cannot send. |
| B10 | Medium | `src/routes/_app.tsx:210` | `pb-safe` is not a defined utility anywhere — the bottom tab bar ignores the iPhone home-indicator inset on a phone-first PWA. Add `pb-[env(safe-area-inset-bottom)]` (or define the utility). Likewise `*:h-unset` (`index.tsx:133`) is a no-op (`h-[unset]` would be the valid form). |
| B11 | Medium | `src/routes/_app/messages.tsx:34` | `selectedId` initialised once from `?dm=` — deep-linking while mounted does nothing. Derive selection from search params with a local override. |
| B12 | Medium | `src/mcp/tools/people.ts:178` (`find_people`) | The intent/topic post-filter ends in an unconditional `return true` — it never filters, and the advertised intents/topics matching isn't in the SQL either. |
| B13 | Medium | dead CTAs | "Save my seat" (`index.tsx:265`), both "Message {owner}" buttons (`projects/*`), the project category pills (hardcoded `active={i===0}`, non-interactive spans), and PersonCard's "Connect" (a styled `<span>` inside the card link — taps navigate instead of connecting). |
| B14 | Medium | `src/routes/api/questions.ts:141` | After POST the route re-hydrates *every* question in the session to return one row. Also `Response.json([], {status:400})` (`questions.ts:113`, `moments.ts:22`) sends a valid-looking empty success payload as an error. |
| B15 | Low | `src/routes/api/answers.ts:49` | Answer insert + status flip not transactional; answers/votes/promotions publish no realtime event while questions/moments/messages do — other viewers' panes go stale. |
| B16 | Low | misc | `AvatarStack` keys by index on dynamic arrays (`avatar.tsx:200`); `timeAgo`/`isLiveNow` call `Date.now()` during render (SSR hydration mismatch risk, and never tick); `search.tsx` fetch has no `catch`; notification dismissal timer never cleared; `meetup-card.tsx` "Join" is local-state-only and lost on refresh; `/search` route is unreachable (no link, ⌘K hint has no global handler). |

## 3. Duplication & drift

The explicit ask: places where code that should be one thing exists as
several, and has already diverged.

### Server / data layer

- **Viewer resolution ×3, three security postures** — the root cause of §1:
  - `queries/messages.ts:24` `resolveViewer(me?)` — trusts caller input.
  - `queries/discussions.ts:107` `viewerId()` — session, nullable. Correct.
  - `concierge/viewer.ts:35` `resolveViewerId()` — session, falls back to
    first seeded user.
  → One `src/lib/viewer.ts` with `getViewerId()` / `requireViewerId()`; the
  demo fallback lives there once, behind an env flag.
- **Question hydration ×3 (+ a 4th author shape)** — `api/questions.ts:25`
  (upvotes desc, createdAt asc, ISO dates, answers), `queries/sessions.ts:61`
  (upvotes desc only — nondeterministic tiebreak, `Date` objects, no
  answers), `queries/discussions.ts:169` (nested `DiscussionAuthor` shape);
  `api/answers.ts:50` adds an author variant without `company`. Tied
  questions can sort differently on the session page vs the questions
  collection.
- **Person listing drift** — `queries.ts:156` (innerJoin: profile-less users
  excluded, ordered by name) vs `api/people.ts:13` (leftJoin: included,
  **no ORDER BY** → the 200-cap slice is nondeterministic). Same `Person`
  type, different membership; SSR list and client collection can disagree.
- **MCP tools vs concierge tools vs queries — same reads ×3, drifted**:
  `get_session_summary` omits answers via `/mcp` but includes them via the
  concierge; `list_projects` orders by `trendingScore` via MCP but by `name`
  via the concierge; `searchPeople` and `my_schedule` are near-line-for-line
  duplicates with different output shapes; `suggest_people` (MCP) and
  `suggestPeopleToMeet` (home) are two different ranking algorithms for the
  same feature. → Extract shared read functions; have MCP and concierge wrap
  them. The `*_app` MCP variants also re-query with different limits/order
  than their plain twins despite claiming "same data".
- Smaller: vote-set lookup duplicated (`discussions.ts:114` vs inline in
  `api/questions.ts:64`); message `serialize()` duplicated
  (`queries/messages.ts:54` vs `api/messages.ts:52`); accept-connection
  logic duplicated *within* `api/connections.ts` (POST path has no existence
  check, different response shape than PATCH); trending-project query ×2;
  `new Headers(getRequestHeaders())` incantation ×2.

### Client

- **Connect CTA ×3, drifted**: `ConnectButton` (`people/$userId.tsx:117`,
  full state machine, optimistic + revert) vs `QuickConnect`
  (`people/index.tsx:159`, reduced machine, **no initial state** — shows
  "Connect" for already-connected people) vs PersonCard's inert `<span>`.
- **Profile body duplicated**: `ProfilePanel` (`people/index.tsx:191`) vs
  `PersonDetail` (`people/$userId.tsx:51`) — identical "Why I'm here"
  gradient block byte-for-byte, but one renders the talk-to-me sections
  conditionally in a responsive grid, the other unconditionally in a fixed
  grid with empty headings.
- **Two BorderBeam systems**: local `ui/card.tsx:7` vs the `border-beam` npm
  package on Home — same name, different props, different visuals.
- **/profile uses Kendo Avatar/Button** while every other screen uses the
  ui-kit `Avatar` — the signed-in user looks different on their own profile
  than in the nav.
- **Time formatting ×4**: `lib/format.ts` `formatTime` duplicated verbatim in
  `concierge/tool-result.tsx:37`; competing `relativeTime` ("4m") vs
  `timeAgo` ("4 min ago"); the same "Related session" line shows "09:30" on
  one projects screen and "Mon · 09:30" on the other.
- **Empty states**: the dashed-card recipe repeats at 4 sites with a 5th
  divergent variant; `NotFound` is duplicated wholesale between
  `people/$userId.tsx:193` and `projects/$slug.tsx:123`. An
  `EmptyState`/`NotFound` component is overdue.
- `AvatarStack` re-implemented by hand in `moment-card.tsx:185` (entries
  needed to be links — the component lacks a `renderItem`); the "live now"
  chip duplicated between `live-player.tsx:111` and `live-slide.tsx:31`;
  `GlassCard` exists but the home composer hand-copies its class string;
  `.converge-textarea` and `.animate-caret` in `styles.css` are dead CSS.

## 4. React hook patterns

**Dominant pattern (good, consistent):** route loader → per-id module-cached
collection (`momentsCollection(sessionId)`) → `useLiveQuery` → SSE
`useEventStream` triggering `collection.utils.refetch()`. Optimistic writes
roll back automatically. The session screen is the reference implementation.

Where it drifts or needs extraction:

- `useEventStream` requires memoised callbacks but doesn't enforce or
  document it (B4). Fix in the hook (callback ref), not at call sites. The
  hook also hardcodes the seven event names — derive them from a shared
  constant next to `src/lib/events.ts` so new server events can't silently
  no-op.
- The SSR mounted-gate idiom (`useState(false)` + `useEffect(setMounted)`)
  is copy-pasted 4× — extract `useMounted()`, and the
  collection + live-query + SSE trio would make a tidy `useSessionCollection`.
- Props-to-state seeding for one-shot optimistic writes (`useQuestionVote`,
  `ConnectButton`) relies on callers remembering `key={id}` to reset — two
  do, others don't; loader invalidations that change counts for the same id
  are ignored. Worth one documented helper.
- Three private `new QueryClient()`s in `db-collections/*` plus the router's
  own — invisible to devtools, four independent caches. Intentional per the
  comment, but one shared collections client would coordinate them.
- Timer hygiene is otherwise good (YT poll, debounced search with stale
  guard, SSE heartbeat cleanup all correct).

## 5. Breakpoints & variants

**Breakpoints.** 24 responsive modifiers in the whole app (`lg:` ×13, `sm:`
×9, `md:` ×2). The implicit strategy is coherent: mobile-first single
column; `lg:` flips to desktop two-pane + top nav (bottom tab bar
`lg:hidden`); `sm:` reveals niceties (speaker column, ⌘K hints); tablets get
the phone UI. It matches the README's "best at ~390px" claim. Gaps:

- TopMatch hero (`people/index.tsx:97`) has no `flex-wrap` + a
  `min-w-[300px]` child — CTAs overflow at 390px (the orphaned `mt-4` on the
  button row suggests it used to wrap).
- Messages below `lg` stacks both panes in one fixed `h-[calc(100vh-220px)]`
  grid — the conversation pane is crushed; the phone-first screen most needs
  a master→detail story.
- Home people grid `md:grid-cols-4 lg:grid-cols-6` truncates names to
  near-uselessness at exactly 1024px.

**Variants.** The kit's discriminators are inconsistent (`Button.variant` +
`size`, `Tag.variant`, `Badge.tone`, `Mono.tone`, `Card.surface`,
`Pill.active/tone/elevated`) and class merging is naive string concat, so
callers can't override base utilities. Result: **~63 `!` escapes**, each a
variant-API gap:

- `Mono` bakes its tracking and has no size prop → 24× `!text-tiny`/
  `!text-caption`/`!tracking-[…]` at call sites, and `LiveProgress`
  neutralises its uppercase at four more.
- `Button` lacks a `lg` size → `capture-dock.tsx:40` rebuilds one with four
  `!` overrides. `Tag` lacks small/pill shapes → `person-card.tsx:51`,
  `project-card.tsx:41`. `Badge` is abused as a CTA (inert `<span>` styled
  to sit next to a Button) on both project screens → the need is a lime-soft
  Button variant.

→ Adopt `cva` + `tailwind-merge`, normalise on `variant` + `size`, add the
missing `Mono size`, `Button lg`, `Tag sm` variants, and the `!` count goes
to ~zero. (The token pass in this PR fixed the *values*; this fixes the
*API*.)

## 6. Performance notes

- `listDiscussions` hydrates every post of every thread to compute channel
  counts (`discussions.ts:298`) — grouped count + hydrate only the featured
  thread.
- Each `MomentCard` fires its own `/api/moments/shared` fetch on mount —
  batch per session in the rail.
- Event bus is unbounded synchronous fan-out with no connection cap
  (`events.ts:20`) and is per-instance — fine for one Railway replica;
  document the constraint or move to LISTEN/NOTIFY before scaling.
- Service worker `CACHE_VERSION` is a hardcoded `'v1'` (`public/sw.js:11`) —
  the activate-cleanup never fires across deploys, so offline-first loads
  can serve a stale shell referencing old chunks. Inject a build hash at
  build time.
- Seed inserts people one-by-one in a loop while the conferences block
  already batches — internal inconsistency, slow at scale.

## 7. Prioritized action list

1. **Auth pass (S1–S5)**: one shared viewer module; `requireUser` on
   messages, connections, stream, concierge, AI settings; channel
   authorization on SSE. _Blocks any non-demo deploy._
2. **Transactions (B2, B3, B15)**: vote toggle, promote, answer+status.
3. **Quick client fixes**: SSR-safe `window.location.origin` (B1),
   `useEventStream` callback ref (B4), Enter-to-send (B9), `pb-safe` (B10),
   wire the dead CTAs (B13).
4. **De-duplication**: shared read/serializer module used by routes, server
   fns, MCP and concierge tools; one ConnectButton; `useMounted`.
5. **UI-kit variant pass**: cva + tailwind-merge, missing sizes; kill the
   63 `!` overrides.
6. **Hardening**: zod `parseBody` on all routes (S10), concierge crypto salt
   + dedicated secret (S7), SW cache versioning, seed guard.

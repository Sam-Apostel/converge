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
  `border-beam` sparingly for special states. Follow the **Styling** rules below.

## Styling

These choices are settled — match them so the design stays consistent.

- **Compose classes with `cn`** (`#/lib/utils`, clsx + tailwind-merge). Pass it
  the base, then any override last so `tailwind-merge` resolves conflicts:
  `cn(buttonVariants({ variant }), className)`. Reusable primitives live in
  `src/components/ui/*` (Button, Badge, Tag, Card, Pill, Avatar, Skeleton, Mono…)
  — reuse them, don't re-roll.
- **Variants use `cva`** — the **beta `cva` package** (import from `'cva'`, *not*
  `class-variance-authority`). Single config object:
  `cva({ base, variants, compoundVariants, defaultVariants })`. Export the recipe
  (`buttonVariants`) and derive types from `VariantProps`. Use `cva` for genuine
  stylistic variants (tone/size/surface); use `cn` for everything else.
- **State → semantic attributes, not conditional classes.** For interactive or
  boolean state set a `data-*`/`aria-*` attribute to `cond || undefined` (never
  `false` — React renders `data-x="false"` as *present*). Style it with the bare
  Tailwind v4 variant: `data-active:bg-ink`, `aria-pressed:text-ink`, and
  `group` + `group-data-active:…` for parent→child. Prefer this over `cn` objects
  or ternaries.
- **No static inline styles.** Static values are Tailwind classes. *Genuinely
  dynamic* runtime values (a size prop, a data-driven %, a hash colour) ride on
  **CSS custom properties** set via `style`, consumed with the v4 paren
  shorthand: `style={{ '--avatar-size': … }}` + `size-(--avatar-size)`. Name vars
  in full (`--avatar-size`, not `--av-s`). A composite shorthand value (background
  *image*, `border` shorthand, a gradient) that no single-value utility maps to
  stays an arbitrary property: `[background:var(--avatar-background)]`.
- **Square brackets `[...]` are a last resort.** Keep them only for: arbitrary
  variants/selectors (`data-*`, `[&_iframe]:`), CSS-var bridges, properties
  Tailwind doesn't model (mask, `scrollbar-width`, gradients, bespoke shadows,
  explicit `transition-[…]` lists), asymmetric grids (`grid-cols-[1.55fr_1fr]`),
  one-off off-grid precision from the design, and brand/art colours. **Don't**
  bracket a value that hits a token (`gap-[16px]`→`gap-4`), arbitrary opacity
  (`bg-white/[.86]`→`bg-white/86`), or a CSS var (use `(--x)`). A bracket value
  that *recurs* is a missing token — promote it to `@theme`.
- **Design tokens live in `@theme`** (`src/styles.css`): colours, `--text-*`,
  `--tracking-*`, `--leading-*`, `--shadow-*`, spacing. Prefer the token utility
  (`text-note`, `tracking-snug`, `leading-body`, `shadow-card`, `bg-pillow`) over
  arbitrary values. **Lime is fills-only**, reserved for live/delight accents.
  One-offs may stay arbitrary; repeated values become tokens.
- **Group long class strings** by role, one cluster per `cn(...)` line, in this
  order: box/participation (position, margin, z, self, sizing) → interior
  (display, padding, gap, align) → typography → skin (bg/border/radius/shadow/
  overflow) → motion → state runs (`hover:` / `data-`/`aria-`) → responsive
  (`sm:`/`lg:`). Only split when length/complexity warrants it; never make
  single-class lines or reorder classes (order affects conflict resolution).
- **Kendo:** theme via Kendo's `--kendo-*` design tokens mapped in `:root`
  (`--kendo-color-primary: var(--color-ink)` …), **not** by overriding `.k-*`
  internals globally. When a component shape has no token, use a scoped, opt-in
  `.converge-*` class (see `.converge-live-bar`/`-textarea`/`-chips`) or a Kendo
  prop (`size`/`rounded`/`fillMode`/`themeColor`). Trivial widgets are hand-rolled
  in Tailwind (toast in `ui/notifications.tsx`, `ui/skeleton.tsx`), not Kendo.

## Verify before done

```bash
bun run typecheck
bun run build
```

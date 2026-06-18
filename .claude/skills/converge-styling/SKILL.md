---
name: converge-styling
description: House styling conventions for this Tailwind v4 + cn + cva codebase. Use when adding or refactoring classNames, building or restyling UI components, creating component variants, wiring interactive/visual state, choosing between a Tailwind class / CSS variable / inline style, or deciding whether a value belongs in the theme. Triggers on styling, className, Tailwind, cn, cva, variants, "add a class", "style this", design tokens, inline styles, arbitrary values, square brackets, data-attribute state, hover/active state, theme tokens, tracking/leading/spacing, refactor styles.
---

# Converge styling conventions

These choices are settled. Match them so the design system stays consistent.
Reusable primitives live in `src/components/ui/*` (Button, Badge, Tag, Card,
Pill, Avatar, Skeleton, Mono…) — **reuse them, don't re-roll.**

## Quick reference

| Need | Do | Don't |
| --- | --- | --- |
| Combine classes | `cn('base', className)` | string templates, `+` |
| Conditional class | data-/aria- attr + `data-x:` variant | `cn('', { 'c': cond })` ternary where an attribute fits |
| Component variants | `cva({ base, variants, … })` from `'cva'` | `class-variance-authority`, manual maps |
| Dynamic value (size/%/hash) | CSS var via `style` + `size-(--x)` | inline `style={{ width }}` |
| Static value | Tailwind class / theme token | inline style |
| Repeated arbitrary value | promote to `@theme` token | copy `[...]` everywhere |

## 1. Compose with `cn`

`cn` (`#/lib/utils`, clsx + tailwind-merge) is the only way to build a class
string. Pass the base first, the caller `className` last so `tailwind-merge`
resolves conflicts in the override's favour.

```tsx
import { cn } from '#/lib/utils'
<span className={cn('rounded-full bg-pillow px-2.5 py-1', className)} />
```

Never use template literals (`` `a ${b}` ``) or `+` to build class strings.

## 2. Variants use `cva` (the beta package)

Import from **`'cva'`** (the v1 beta), *not* `class-variance-authority`. One
config object. Export the recipe and derive the prop types from `VariantProps`.
Wrap the recipe in `cn` at the call site so a `className` override still wins.

```tsx
import { cva } from 'cva'
import type { VariantProps } from 'cva'
import { cn } from '#/lib/utils'

export const badgeVariants = cva({
  base: ['inline-flex items-center gap-1.5 rounded-full px-2.5 py-1', 'text-tiny font-semibold'],
  variants: {
    tone: { lime: 'bg-lime text-ink', dark: 'bg-ink text-white' },
    mono: { true: 'font-mono', false: '' },
  },
  defaultVariants: { tone: 'lime', mono: false },
})
export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>

export function Badge({ tone, mono, className, children }: …) {
  return <span className={cn(badgeVariants({ tone, mono }), className)}>{children}</span>
}
```

Use `cva` for genuine stylistic variants (tone/size/surface). Use `cn` for
everything else. Compound combinations go in `compoundVariants: [{ …, class: '…' }]`.

## 3. State → semantic attributes, not conditional classes

For interactive or boolean state, set a `data-*`/`aria-*` attribute and style it
with the **bare Tailwind v4 variant** (`data-active:`, `aria-pressed:`,
`group-data-active:`). This is preferred over `cn` objects/ternaries.

- Set the attribute to **`cond || undefined`** — never `false`. React renders
  `data-x={false}` as `data-x="false"`, which the selector treats as *present*.
- Parent → child: put `group` + `data-*` on the parent, `group-data-x:…` on
  children.
- Drive styling off the attribute; don't also duplicate the boolean into a class
  object.

```tsx
// element's own state
<button data-active={active || undefined}
  className="text-faint data-active:font-semibold data-active:text-ink" />

// parent → children
<a data-live={live || undefined}
   className="group bg-white data-live:bg-ink-gradient data-live:text-white">
  <span className="text-ink group-data-live:text-white">{title}</span>
</a>

// real ARIA state
<button aria-pressed={on} className="text-slate aria-pressed:text-ink" />
```

For state that maps to a config object (not an element flag), a `cn` object is
still fine — but reach for the attribute first.

## 4. No static inline styles

Static values are Tailwind classes. *Genuinely dynamic* runtime values — a numeric
size prop, a data-driven percentage, a hash-derived colour — ride on **CSS custom
properties** set via `style`, consumed with the v4 paren shorthand.

```tsx
<span
  style={{ '--avatar-size': `${size}px` } as CSSProperties}
  className="size-(--avatar-size) rounded-(--avatar-radius)"
/>
```

- **Name vars in full**: `--avatar-size`, not `--av-s`.
- Paren shorthand only maps *single-value* utilities. A composite shorthand value
  (a background **image** `center/cover url(…)`, a `border` shorthand, a gradient)
  stays an arbitrary property: `[background:var(--avatar-background)]`.
- Typed bridges: `text-(length:--avatar-font-size)`, `text-(color:--avatar-ink)`.

## 5. Square brackets `[...]` are a last resort

Keep brackets only for:
- arbitrary variants/selectors with no static form — `data-*`, `[&_iframe]:`
- CSS-var bridges — `size-(--x)` (use the paren form), `[background:var(--x)]`
- properties Tailwind doesn't model — `mask`, `scrollbar-width`, gradients,
  bespoke `[box-shadow:…]`, explicit `transition-[transform,box-shadow]` lists,
  `[animation:…]` (prefer `animate-[…]`)
- asymmetric grids — `grid-cols-[1.55fr_1fr]`
- one-off off-grid precision from the design — `border-[1.5px]`, `scale-[0.97]`
- brand / art-asset colours — `bg-[#D97757]`

**Don't** bracket:
- a value that hits a token — `gap-[16px]` → `gap-4`
- arbitrary opacity — `bg-white/[.86]` → `bg-white/86`
- a CSS variable — use `(--x)`, not `[var(--x)]`
- a value that *recurs* — that's a missing token; promote it to `@theme`.

## 6. Design tokens live in `@theme`

Tokens (colours, `--text-*`, `--tracking-*`, `--leading-*`, `--shadow-*`,
spacing) live in `@theme` in `src/styles.css`. Prefer the token utility over an
arbitrary value: `text-note`, `tracking-snug`, `leading-body`, `shadow-card`,
`bg-pillow`. A one-off may stay arbitrary; a repeated value becomes a token.
**Lime is fills-only**, reserved for live / delight accents.

## 7. Group long class strings by role

When a class string is long or multi-cluster, split it into grouped `cn(...)`
arguments, one role cluster per line, in this order:

1. box / participation — position, inset, `z`, margin, self/justify-self, sizing
2. interior — display, flex/grid, align, gap, padding
3. typography — `font-`/`text-`/`leading-`/`tracking-`/`tabular-nums`
4. skin — `bg`/`border`/`rounded`/`shadow`/`ring`/`overflow`/`[background:…]`
5. motion — `transition`/`duration`/`ease`/`animate-`
6. state runs — `hover:`/`focus:`/`active:`, then `data-`/`aria-`/`group-data-`
7. responsive — `sm:`/`md:`/`lg:`

```tsx
className={cn(
  'group flex items-center gap-4 px-4 py-3.5',
  'rounded-2xl bg-white shadow-card',
  'transition-[transform,box-shadow] duration-150',
  'hover:-translate-y-px hover:shadow-card-hover',
  'data-live:bg-ink-gradient data-live:text-white',
)}
```

Only split when length/complexity warrants it — short strings stay on one line.
Never make single-class lines, and never reorder classes (order affects
`tailwind-merge` conflict resolution).

import { cva } from 'cva'
import type { ReactNode } from 'react'

import { cn } from '#/lib/utils'

/**
 * Rounded pill used for nav links and filter chips.
 * - active + tone "dark"/"lime" → solid fill
 * - inactive + elevated → white neumorphic chip (filter rows)
 * - inactive + !elevated → plain text link (top nav)
 *
 * The active/elevated state is also exposed as `data-active` / `data-elevated`
 * so call sites and tests can target the semantic state, not the classes.
 */
const pillVariants = cva({
  base: [
    'inline-flex items-center gap-2 rounded-full px-4 py-2',
    'text-note font-medium text-slate',
    'transition-colors',
    'hover:text-ink',
  ],
  variants: {
    tone: { dark: '', lime: '' },
    elevated: { true: '', false: '' },
    active: { true: '', false: '' },
  },
  compoundVariants: [
    { active: false, elevated: true, class: 'bg-white shadow-soft' },
    {
      active: true,
      tone: 'dark',
      class: 'bg-ink text-white hover:text-white',
    },
    { active: true, tone: 'lime', class: 'bg-lime text-ink hover:text-ink' },
  ],
  defaultVariants: { tone: 'dark', active: false, elevated: false },
})

export function Pill({
  active = false,
  tone = 'dark',
  elevated = false,
  className,
  children,
}: {
  active?: boolean
  tone?: 'dark' | 'lime'
  elevated?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <span
      data-active={active || undefined}
      data-elevated={elevated || undefined}
      className={cn(pillVariants({ tone, active, elevated }), className)}
    >
      {children}
    </span>
  )
}

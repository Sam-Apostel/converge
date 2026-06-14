import { cva } from 'cva'
import type { VariantProps } from 'cva'
import type { ReactNode } from 'react'

import { cn } from '#/lib/utils'

export const badgeVariants = cva({
  base: [
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
    'text-tiny font-semibold leading-none',
  ],
  variants: {
    tone: {
      // solid lime — match %, counts on dark
      lime: 'bg-lime text-ink',
      // pale lime — SPEAKER, count chips, "live · interactive"
      'lime-soft': 'bg-lime/30 text-ink',
      dark: 'bg-ink text-white',
      ghost: 'bg-white/10 text-white',
    },
    mono: { true: 'font-mono', false: '' },
  },
  defaultVariants: { tone: 'lime-soft', mono: false },
})

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>

export function Badge({
  tone,
  mono,
  className,
  children,
}: {
  tone?: BadgeTone
  mono?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <span className={cn(badgeVariants({ tone, mono }), className)}>
      {children}
    </span>
  )
}

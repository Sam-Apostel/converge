import { cva } from 'cva'
import type { VariantProps } from 'cva'
import type { ReactNode } from 'react'

import { cn } from '#/lib/utils'

export const tagVariants = cva({
  base: [
    'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1',
    'text-caption font-medium',
  ],
  variants: {
    variant: {
      // tech-stack / interest tags
      neutral: 'bg-tag text-slate',
      // "talk to me about" — lime fill, dark text
      lime: 'bg-lime/28 text-ink-2',
      // "please don't" — faded + struck through
      strike: 'bg-inner text-faint line-through',
      // pillow tags (e.g. "seeks contributors")
      soft: 'bg-pillow text-ink/80',
    },
  },
  defaultVariants: { variant: 'neutral' },
})

export type TagVariant = NonNullable<
  VariantProps<typeof tagVariants>['variant']
>

export function Tag({
  variant,
  className,
  children,
}: {
  variant?: TagVariant
  className?: string
  children: ReactNode
}) {
  return (
    <span className={cn(tagVariants({ variant }), className)}>{children}</span>
  )
}

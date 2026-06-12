import type { ReactNode } from 'react'

export type TagVariant = 'neutral' | 'lime' | 'strike' | 'soft'

const VARIANT: Record<TagVariant, string> = {
  // tech-stack / interest tags
  neutral: 'bg-tag text-slate',
  // "talk to me about" — lime fill, dark text
  lime: 'bg-lime/28 text-ink-2',
  // "please don't" — faded + struck through
  strike: 'bg-inner text-faint line-through',
  // pillow tags (e.g. "seeks contributors")
  soft: 'bg-pillow text-ink/80',
}

export function Tag({
  variant = 'neutral',
  className = '',
  children,
}: {
  variant?: TagVariant
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-caption font-medium ${VARIANT[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

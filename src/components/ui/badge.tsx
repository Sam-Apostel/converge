import type { ReactNode } from 'react'

export type BadgeTone = 'lime' | 'lime-soft' | 'dark' | 'ghost'

const TONE: Record<BadgeTone, string> = {
  // solid lime — match %, counts on dark
  lime: 'bg-lime text-ink',
  // pale lime — SPEAKER, count chips, "live · interactive"
  'lime-soft': 'bg-lime/30 text-ink',
  dark: 'bg-ink text-white',
  ghost: 'bg-white/10 text-white',
}

export function Badge({
  tone = 'lime-soft',
  mono = false,
  className = '',
  children,
}: {
  tone?: BadgeTone
  mono?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${
        mono ? 'font-mono' : ''
      } ${TONE[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

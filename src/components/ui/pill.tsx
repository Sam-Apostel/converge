import type { ReactNode } from 'react'

/**
 * Rounded pill used for nav links and filter chips.
 * - active + tone "dark"/"lime" → solid fill
 * - inactive + elevated → white neumorphic chip (filter rows)
 * - inactive + !elevated → plain text link (top nav)
 */
export function Pill({
  active = false,
  tone = 'dark',
  elevated = false,
  className = '',
  children,
}: {
  active?: boolean
  tone?: 'dark' | 'lime'
  elevated?: boolean
  className?: string
  children: ReactNode
}) {
  const base =
    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-colors'
  const state = active
    ? tone === 'lime'
      ? 'bg-lime text-ink'
      : 'bg-ink text-white'
    : elevated
      ? 'bg-white text-slate shadow-soft hover:text-ink'
      : 'text-slate hover:text-ink'
  return <span className={`${base} ${state} ${className}`}>{children}</span>
}

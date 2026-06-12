import { ChevronDown, ChevronUp } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

export type MonoTone = 'faint' | 'slate' | 'lime' | 'mute' | 'ghost'

const MONO_COLOR: Record<MonoTone, string> = {
  faint: 'var(--color-faint)',
  slate: 'var(--color-slate)',
  lime: 'var(--color-lime)',
  mute: '#b9bccb',
  ghost: '#9aa0bc',
}

/**
 * Geist Mono uppercase eyebrow/label. Color comes from `tone` (applied inline)
 * so it never collides with Tailwind text-color utilities at the call site.
 */
export function Mono({
  children,
  tone = 'faint',
  className = '',
  style,
}: {
  children: ReactNode
  tone?: MonoTone
  className?: string
  style?: CSSProperties
}) {
  return (
    <span
      className={`font-mono uppercase tracking-[0.12em] ${className}`}
      style={{ color: MONO_COLOR[tone], ...style }}
    >
      {children}
    </span>
  )
}

/** Pulsing lime presence dot. */
export function LiveDot({
  size = 7,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <span
      className={`animate-live-pulse inline-block rounded-full bg-lime ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

/**
 * Tinted placeholder used for slide screenshots and project/cover thumbnails —
 * the diagonal two-tone hatch from the design.
 */
export function Thumb({
  tint = '#eef0f8',
  height = 104,
  radius = 14,
  className = '',
  children,
}: {
  tint?: string
  height?: number | string
  radius?: number
  className?: string
  children?: ReactNode
}) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        height,
        borderRadius: radius,
        background: `repeating-linear-gradient(135deg, ${tint} 0 12px, rgba(255,255,255,.45) 12px 24px)`,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Up/down vote control for questions. Static by default (used in read-only
 * thread views); pass `onUpvote` to make the ▲ a real toggle button, and
 * `active` to show the viewer's vote as a lime fill.
 */
export function VoteControl({
  count,
  downvote = false,
  onUpvote,
  active = false,
}: {
  count: number
  downvote?: boolean
  onUpvote?: () => void
  active?: boolean
}) {
  return (
    <div
      className={`flex min-w-[42px] flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 transition-colors ${
        active ? 'bg-lime/25' : 'bg-pillow'
      }`}
    >
      {onUpvote ? (
        <button
          type="button"
          onClick={onUpvote}
          aria-pressed={active}
          aria-label={active ? 'Remove upvote' : 'Upvote'}
          className={`leading-none transition-colors ${
            active ? 'text-ink' : 'text-slate hover:text-ink'
          }`}
        >
          <ChevronUp size={15} strokeWidth={2.5} />
        </button>
      ) : (
        <ChevronUp size={15} strokeWidth={2.5} className="text-slate" />
      )}
      <span className="text-note font-semibold tabular-nums">{count}</span>
      {downvote && (
        <ChevronDown size={15} strokeWidth={2.5} className="text-frost" />
      )}
    </div>
  )
}

import { cva } from 'cva'
import type { VariantProps } from 'cva'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

import { cn } from '#/lib/utils'

const monoVariants = cva({
  base: 'font-mono uppercase tracking-eyebrow',
  variants: {
    tone: {
      faint: 'text-faint',
      slate: 'text-slate',
      lime: 'text-lime',
      mute: 'text-[#b9bccb]',
      ghost: 'text-[#9aa0bc]',
    },
  },
  defaultVariants: { tone: 'faint' },
})

export type MonoTone = NonNullable<VariantProps<typeof monoVariants>['tone']>

/**
 * Geist Mono uppercase eyebrow/label. Color comes from `tone`; a `text-*`
 * utility in `className` overrides it (cn resolves the conflict).
 */
export function Mono({
  children,
  tone,
  className,
}: {
  children: ReactNode
  tone?: MonoTone
  className?: string
}) {
  return (
    <span className={cn(monoVariants({ tone }), className)}>{children}</span>
  )
}

/** Pulsing lime presence dot. `--dot-size` carries the runtime size. */
export function LiveDot({
  size = 7,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <span
      style={{ '--dot-size': `${size}px` } as CSSProperties}
      className={cn(
        'animate-live-pulse inline-block size-(--dot-size) rounded-full bg-lime',
        className,
      )}
    />
  )
}

/**
 * Tinted placeholder used for slide screenshots and project/cover thumbnails —
 * the diagonal two-tone hatch from the design. Tint/height/radius ride in on
 * custom properties so the static gradient recipe stays in a class.
 */
export function Thumb({
  tint = '#eef0f8',
  height = 104,
  radius = 14,
  className,
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
      style={
        {
          '--thumb-tint': tint,
          '--thumb-height': typeof height === 'number' ? `${height}px` : height,
          '--thumb-radius': `${radius}px`,
        } as CSSProperties
      }
      className={cn(
        'relative h-(--thumb-height) overflow-hidden rounded-(--thumb-radius)',
        '[background:repeating-linear-gradient(135deg,var(--thumb-tint)_0_12px,rgba(255,255,255,.45)_12px_24px)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * Up/down vote control for questions. Static by default (used in read-only
 * thread views); pass `onUpvote` to make the ▲ a real toggle button, and
 * `active` to show the viewer's vote as a lime fill. The viewer's vote is
 * carried on `aria-pressed`/`data-active` so the styling keys off semantics.
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
      data-active={active || undefined}
      className={cn(
        'flex min-w-[42px] flex-col items-center gap-0.5',
        'rounded-xl bg-pillow px-2.5 py-1.5',
        'transition-colors',
        'data-active:bg-lime/25',
      )}
    >
      {onUpvote ? (
        <button
          type="button"
          onClick={onUpvote}
          aria-pressed={active}
          aria-label={active ? 'Remove upvote' : 'Upvote'}
          className={cn(
            'leading-none text-slate transition-colors',
            'hover:text-ink aria-pressed:text-ink',
          )}
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

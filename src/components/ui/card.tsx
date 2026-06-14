import { cva } from 'cva'
import type { VariantProps } from 'cva'
import type { CSSProperties, ReactNode } from 'react'

import { cn } from '#/lib/utils'

/**
 * Animated lime beam that sweeps around the border of a dark card.
 * Parent must be `position:relative overflow-hidden`. The sweep duration is
 * driven by the `--beam-speed` custom property (the one genuinely dynamic bit).
 */
export function BorderBeam({ speed = 4.8 }: { speed?: number }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-[inherit] p-[1.5px]',
        '[-webkit-mask-composite:xor] [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:exclude]',
      )}
    >
      <div
        style={{ '--beam-speed': `${speed}s` } as CSSProperties}
        className={cn(
          'absolute left-1/2 top-1/2 aspect-square w-[220%]',
          'animate-[beamRot_var(--beam-speed)_linear_infinite]',
          '[background:conic-gradient(from_0deg,transparent_0_74%,#99ff00_84%,#eaffc4_90%,#99ff00_96%,transparent_100%)]',
        )}
      />
    </div>
  )
}

const cardVariants = cva({
  base: 'rounded-2xl',
  variants: {
    surface: {
      white: 'bg-white text-ink shadow-card',
      inner: 'bg-inner text-ink',
      dark: 'bg-ink text-white',
      glass: cn(
        'border border-white/60 bg-white/30 backdrop-blur-2xl',
        '[box-shadow:0_18px_50px_rgba(40,50,110,.18),inset_0_1px_0_rgba(255,255,255,.7)]',
      ),
    },
  },
  defaultVariants: { surface: 'white' },
})

type Surface = NonNullable<VariantProps<typeof cardVariants>['surface']>

/**
 * The dark "hero" surface with a lime radial glow — the recurring spotlight
 * used for the next-session card, the meetup outcome, and the top-match banner.
 * Override the gradient via `style.background` when a screen needs a tint.
 */
export function Spotlight({
  className,
  beam = false,
  children,
  style,
}: {
  className?: string
  glow?: 'top-right' | 'right'
  beam?: boolean
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div
      className={cn(
        'bg-ink-gradient relative overflow-hidden rounded-[22px] text-white',
        className,
      )}
      style={style}
    >
      {beam && <BorderBeam speed={4.8} />}
      <div className="relative">{children}</div>
    </div>
  )
}

/**
 * Glass frame (translucent blurred border) wrapping an opaque white nested
 * container — the design's primary card pattern for content that sits against
 * the ambient periwinkle background.
 */
export function GlassCard({
  className,
  innerClassName,
  children,
  style,
}: {
  className?: string
  innerClassName?: string
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div
      className={cn(
        'rounded-[26px] border border-white/60 bg-white/32 p-2 shadow-card',
        '[backdrop-filter:blur(22px)_saturate(1.7)]',
        className,
      )}
      style={style}
    >
      <div className={cn('rounded-[18px] bg-white', innerClassName)}>
        {children}
      </div>
    </div>
  )
}

/** The neumorphic surface that nearly every screen is built from. */
export function Card({
  surface,
  className,
  children,
  style,
}: {
  surface?: Surface
  className?: string
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div className={cn(cardVariants({ surface }), className)} style={style}>
      {children}
    </div>
  )
}

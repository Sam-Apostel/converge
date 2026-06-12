import type { CSSProperties, ReactNode } from 'react'

/**
 * Animated lime beam that sweeps around the border of a dark card.
 * Parent must be `position:relative overflow-hidden`.
 */
export function BorderBeam({ speed = 4.8 }: { speed?: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-[inherit]"
      style={{
        padding: '1.5px',
        WebkitMask:
          'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
      }}
    >
      <div
        className="absolute left-1/2 top-1/2 aspect-square w-[220%]"
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0 74%, #99ff00 84%, #eaffc4 90%, #99ff00 96%, transparent 100%)',
          animation: `beamRot ${speed}s linear infinite`,
        }}
      />
    </div>
  )
}

type Surface = 'white' | 'inner' | 'dark' | 'glass'

const SURFACE: Record<Surface, string> = {
  white: 'bg-white text-ink shadow-card',
  inner: 'bg-inner text-ink',
  dark: 'bg-ink text-white',
  glass:
    'border border-white/60 bg-white/30 backdrop-blur-2xl [box-shadow:0_18px_50px_rgba(40,50,110,.18),inset_0_1px_0_rgba(255,255,255,.7)]',
}

/**
 * The dark "hero" surface with a lime radial glow — the recurring spotlight
 * used for the next-session card, the meetup outcome, and the top-match banner.
 * Override the gradient via `style.background` when a screen needs a tint.
 */
export function Spotlight({
  className = '',
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
      className={`bg-ink-gradient relative overflow-hidden rounded-[22px] text-white ${className}`}
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
  className = '',
  innerClassName = '',
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
      className={`rounded-[26px] border border-white/60 bg-white/32 p-2 [backdrop-filter:blur(22px)_saturate(1.7)] shadow-card ${className}`}
      style={style}
    >
      <div className={`rounded-[18px] bg-white ${innerClassName}`}>
        {children}
      </div>
    </div>
  )
}

/** The neumorphic surface that nearly every screen is built from. */
export function Card({
  surface = 'white',
  className = '',
  children,
  style,
}: {
  surface?: Surface
  className?: string
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div
      className={`rounded-2xl ${SURFACE[surface]} ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}

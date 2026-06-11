import type { CSSProperties, ReactNode } from 'react'

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
  glow = 'top-right',
  children,
  style,
}: {
  className?: string
  glow?: 'top-right' | 'right'
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[22px] text-white ${className}`}
      style={{ background: 'linear-gradient(135deg,#13141d,#1c1e2e)', ...style }}
    >
      <div
        className="pointer-events-none absolute h-36 w-36 rounded-full [background:radial-gradient(circle,rgba(153,255,0,.35),transparent_70%)]"
        style={
          glow === 'right'
            ? { right: '9%', top: -46, width: 210, height: 210 }
            : { right: -30, top: -30 }
        }
      />
      <div className="relative">{children}</div>
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
    <div className={`rounded-2xl ${SURFACE[surface]} ${className}`} style={style}>
      {children}
    </div>
  )
}

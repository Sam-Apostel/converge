import { useId } from 'react'
import type { CSSProperties } from 'react'

import { cn } from '#/lib/utils'

/**
 * Converge brand mark.
 *
 * The "C" is a glassy ring: it actually blurs whatever sits behind it via
 * `backdrop-filter`, tinted with the brand yellow and lit with an inner glow +
 * top sheen. The person (head + shoulders) inside the C is solid yellow.
 *
 * Glass needs texture behind it to read — by default we paint a branded blue
 * tile (gradient + radar rings + grain). Pass `background={false}` to drop the
 * tile and let the C blur the real page content underneath it instead.
 */

// Geometry lifted from the source SVG (64×64 design space).
const ARC =
  'M51.447,50.491c0.556,0.528 0.839,1.282 0.767,2.046c-0.071,0.763 -0.489,1.452 -1.134,1.867c-4.262,2.604 -9.307,4.126 -14.715,4.126c-15.117,0 -27.39,-11.888 -27.39,-26.53c0,-14.642 12.273,-26.53 27.39,-26.53c5.408,-0 10.453,1.522 14.701,4.147c0.638,0.411 1.052,1.093 1.123,1.849c0.071,0.756 -0.209,1.502 -0.759,2.025c-1.905,1.845 -4.633,4.438 -6.227,5.953c-0.756,0.719 -1.88,0.892 -2.817,0.435c-1.815,-0.873 -3.861,-1.351 -6.021,-1.351c-7.677,-0 -13.909,6.037 -13.909,13.472c0,7.435 6.232,13.472 13.909,13.472c2.16,0 4.206,-0.478 6.03,-1.331c0.93,-0.453 2.043,-0.281 2.792,0.431c1.61,1.499 4.338,4.092 6.26,5.919Z'
const SHOULDERS =
  'M51.481,50.523c0.547,0.52 0.826,1.262 0.756,2.014c-0.07,0.751 -0.48,1.43 -1.114,1.84c-4.271,2.621 -9.331,4.153 -14.758,4.153c-5.428,0 -10.488,-1.532 -14.746,-4.174c-0.627,-0.406 -1.034,-1.077 -1.103,-1.822c-0.069,-0.744 0.207,-1.479 0.749,-1.994c1.914,-1.852 4.678,-4.479 6.279,-6.001c0.746,-0.709 1.854,-0.879 2.779,-0.427c1.82,0.878 3.873,1.36 6.042,1.36c2.168,0 4.221,-0.482 6.051,-1.34c0.916,-0.449 2.014,-0.28 2.754,0.423c1.616,1.506 4.38,4.133 6.311,5.968Z'
const HEAD = { cx: 36.365, cy: 32, rx: 6, ry: 6 }

const BRAND = '#ffdf00'

export function ConvergeLogo({
  size = 64,
  background = true,
  rounded = '22%',
  className,
  title = 'Converge',
}: {
  /** Rendered width & height in px. */
  size?: number
  /** Paint the branded blue tile behind the C. When false the C blurs the DOM behind it. */
  background?: boolean
  /** Corner radius of the tile (any CSS length / %). */
  rounded?: string
  className?: string
  title?: string
}) {
  // Namespace SVG ids so multiple instances don't collide.
  const uid = useId().replace(/[:]/g, '')
  const id = (name: string) => `${name}-${uid}`

  // Clip the backdrop-blur to the arc shape via a mask image.
  const maskUrl = `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><path d='${ARC}' fill='%23000'/></svg>`,
  )}")`

  // Blur scales with the mark so it reads the same at any size.
  const blur = Math.max(1.5, size * 0.055)

  return (
    <div
      role="img"
      aria-label={title}
      className={cn(
        'relative isolate size-(--logo-size) overflow-hidden rounded-(--logo-radius) bg-[#1A1B29]',
        className,
      )}
      style={
        {
          '--logo-size': `${size}px`,
          '--logo-radius': rounded,
          '--logo-blur': `${blur}px`,
          '--logo-mask': maskUrl,
        } as CSSProperties
      }
    >
      {/* 1 — Textured backdrop (gives the glass something to blur). */}
      {background ? (
        <>
          <div
            className={cn(
              'absolute inset-0',
              '[background:radial-gradient(125%_125%_at_22%_14%,#7e9ce4_0%,#4a6fcf_42%,#2a4eac_78%,#1f3f97_100%)]',
            )}
          />
          <svg
            viewBox="0 0 64 64"
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full"
          >
            {/* faint radar rings + grid */}
            <g
              fill="none"
              stroke="#ffffff"
              strokeOpacity={0.12}
              strokeWidth={0.4}
            >
              <circle cx={22} cy={28} r={20} />
              <circle cx={22} cy={28} r={34} />
              <circle cx={22} cy={28} r={48} />
              <path d="M21.5 -4 V68 M-4 28.5 H68 M43 -4 V68 M-4 52 H68" />
            </g>
          </svg>
          {/* grain so the blur has high-frequency detail to smear */}
          <svg className="absolute inset-0 h-full w-full opacity-50 mix-blend-overlay">
            <filter id={id('grain')}>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.9"
                numOctaves={2}
                stitchTiles="stitch"
              />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter={`url(#${id('grain')})`} />
          </svg>
        </>
      ) : null}

      {/* 2 — The glass: real backdrop blur, masked to the C arc, brand-tinted. */}
      <div
        className={cn(
          'absolute inset-0 bg-[rgba(255,223,0,0.3)]',
          '[-webkit-backdrop-filter:blur(var(--logo-blur))_saturate(1.6)]',
          '[-webkit-mask-image:var(--logo-mask)]',
          '[-webkit-mask-repeat:no-repeat]',
          '[-webkit-mask-size:100%_100%]',
          '[backdrop-filter:blur(var(--logo-blur))_saturate(1.6)]',
          '[mask-image:var(--logo-mask)]',
          '[mask-repeat:no-repeat]',
          '[mask-size:100%_100%]',
        )}
      />

      {/* 3 — Glass lighting: top sheen + inner glow + crisp edge, kept inside the arc. */}
      <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full">
        <defs>
          <clipPath id={id('arc')}>
            <path d={ARC} />
          </clipPath>
          <linearGradient id={id('sheen')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.5} />
            <stop offset="45%" stopColor="#ffffff" stopOpacity={0.06} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
          </linearGradient>
          <filter id={id('innerGlow')}>
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>
        <g clipPath={`url(#${id('arc')})`}>
          {/* soft glow hugging the inside of the ring */}
          <path
            d={ARC}
            fill="none"
            stroke="#fff6b0"
            strokeWidth={2.4}
            strokeOpacity={0.55}
            filter={`url(#${id('innerGlow')})`}
          />
          {/* top-lit sheen across the glass */}
          <path d={ARC} fill={`url(#${id('sheen')})`} />
          {/* crisp lit edge */}
          <path
            d={ARC}
            fill="none"
            stroke="#ffe865"
            strokeWidth={0.5}
            strokeOpacity={0.7}
          />
        </g>
      </svg>

      {/* 4 — The person, solid brand yellow, with a faint bloom. */}
      <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full">
        <defs>
          <filter id={id('bloom')} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g fill={BRAND} filter={`url(#${id('bloom')})`}>
          <ellipse cx={HEAD.cx} cy={HEAD.cy} rx={HEAD.rx} ry={HEAD.ry} />
          <path d={SHOULDERS} />
        </g>
      </svg>
    </div>
  )
}

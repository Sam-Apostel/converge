import type { CSSProperties, ReactNode } from 'react'

/** The moodboard avatar palette — soft tints with a matching ink. */
export const AVATAR_PALETTE: Array<{ bg: string; ink: string }> = [
  { bg: '#dfe2f6', ink: '#4b5170' },
  { bg: '#dcebf3', ink: '#3f6173' },
  { bg: '#d8f0bf', ink: '#3a3e54' },
  { bg: '#e7e0f6', ink: '#5b4f7a' },
  { bg: '#eae3f6', ink: '#5b4f7a' },
  { bg: '#dfe7f6', ink: '#42577a' },
  { bg: '#ece4f4', ink: '#5b4f7a' },
  { bg: '#e2eef0', ink: '#3f6173' },
]

function hash(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

/** Deterministic palette entry for a name/id so an avatar is stable across views. */
export function paletteFor(seed: string) {
  return AVATAR_PALETTE[hash(seed) % AVATAR_PALETTE.length]
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export type AvatarProps = {
  /** Display name — used to derive initials and a stable palette. */
  name?: string
  /** Explicit initials/abbreviation (e.g. project "ra"); overrides derived. */
  initials?: string
  /** Image url; when present it replaces the initials. */
  src?: string | null
  /** Explicit tint + ink, overriding the derived palette. */
  bg?: string
  ink?: string
  size?: number
  shape?: 'circle' | 'squircle'
  /** Presence dot: true/'online' = lime, 'offline' = grey. */
  dot?: boolean | 'online' | 'offline'
  /** Ring border color (used in stacks to separate overlaps). */
  border?: string
  /** Lime match-ring (0–100) wrapping the avatar, e.g. the top-match hero. */
  ring?: number
  /** Small badge pinned to the bottom of the ring (e.g. "96%"). */
  ringLabel?: ReactNode
  className?: string
  title?: string
  style?: CSSProperties
}

export function Avatar({
  name,
  initials,
  src,
  bg,
  ink,
  size = 40,
  shape = 'circle',
  dot,
  border,
  ring,
  ringLabel,
  className,
  title,
  style,
}: AvatarProps) {
  const pal = name ? paletteFor(name) : AVATAR_PALETTE[0]
  const background = bg ?? pal.bg
  const color = ink ?? pal.ink
  const label = initials ?? (name ? initialsOf(name) : '?')
  const radius = shape === 'squircle' ? Math.round(size * 0.28) : size

  const dotColor =
    dot === 'offline' ? '#cfd4e2' : dot ? 'var(--color-lime-deep)' : null

  const inner = (
    <span
      className={ring ? undefined : className}
      title={title}
      style={{
        position: 'relative',
        width: size,
        height: size,
        flex: '0 0 auto',
        borderRadius: radius,
        background: src ? `center/cover url(${src})` : background,
        color,
        display: 'grid',
        placeItems: 'center',
        fontWeight: 600,
        fontSize: Math.max(10, Math.round(size * 0.36)),
        letterSpacing: '-0.01em',
        border: border
          ? `${Math.max(2, size * 0.06)}px solid ${border}`
          : undefined,
        ...style,
      }}
    >
      {!src && label}
      {dotColor && (
        <span
          style={{
            position: 'absolute',
            bottom: shape === 'circle' ? 1 : 2,
            right: shape === 'circle' ? 0 : 2,
            width: Math.max(9, size * 0.23),
            height: Math.max(9, size * 0.23),
            borderRadius: '50%',
            background: dotColor,
            border: '2px solid #fff',
          }}
        />
      )}
    </span>
  )

  if (ring == null) return inner

  const ringSize = size + 12
  return (
    <span
      className={className}
      style={{
        position: 'relative',
        width: ringSize,
        height: ringSize,
        flex: '0 0 auto',
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: `conic-gradient(var(--color-lime) 0% ${ring}%, rgba(255,255,255,.16) ${ring}% 100%)`,
      }}
    >
      {inner}
      {ringLabel != null && (
        <span
          style={{
            position: 'absolute',
            bottom: -7,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--color-lime)',
            color: '#13141d',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 7px',
            borderRadius: 99,
            border: '2px solid #181b2b',
          }}
        >
          {ringLabel}
        </span>
      )}
    </span>
  )
}

export type AvatarStackEntry = {
  name?: string
  initials?: string
  src?: string | null
  bg?: string
  ink?: string
  title?: string
}

/** Overlapping avatars with an optional "+N" overflow chip. */
export function AvatarStack({
  people,
  size = 32,
  max = 5,
  border = '#fff',
  overflowBg = '#13141d',
  overflowInk = '#fff',
}: {
  people: Array<AvatarStackEntry>
  size?: number
  max?: number
  border?: string
  overflowBg?: string
  overflowInk?: string
}) {
  const shown = people.slice(0, max)
  const overflow = people.length - shown.length
  const overlap = Math.round(size * 0.32)

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((p, i) => (
        <Avatar
          key={i}
          {...p}
          size={size}
          border={border}
          style={{
            marginLeft: i === 0 ? 0 : -overlap,
            zIndex: shown.length - i,
          }}
        />
      ))}
      {overflow > 0 && (
        <Avatar
          initials={`+${overflow}`}
          bg={overflowBg}
          ink={overflowInk}
          size={size}
          border={border}
          style={{ marginLeft: -overlap }}
        />
      )}
    </div>
  )
}

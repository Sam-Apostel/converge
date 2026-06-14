import type { CSSProperties } from 'react'

import { cn } from '#/lib/utils'

/** The moodboard avatar palette — soft tints with a matching ink. */
const AVATAR_PALETTE: Array<{ bg: string; ink: string }> = [
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

/**
 * Default avatars keyed by normalized name — used when a person has no explicit
 * image of their own. Lets us seed a real photo for known people.
 */
const NAME_AVATARS: Record<string, string> = {
  'sam apostel': '/avatars/sam-apostel.jpg',
}

/** A built-in default avatar for this name, if any (case/space-insensitive). */
export function defaultAvatarFor(name?: string): string | undefined {
  if (!name) return undefined
  return NAME_AVATARS[name.trim().toLowerCase().replace(/\s+/g, ' ')]
}

function initialsOf(name: string): string {
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
  className,
  title,
  style,
}: AvatarProps) {
  const pal = name ? paletteFor(name) : AVATAR_PALETTE[0]
  const background = bg ?? pal.bg
  const color = ink ?? pal.ink
  const label = initials ?? (name ? initialsOf(name) : '?')
  const resolvedSrc = src ?? defaultAvatarFor(name)
  const radius = shape === 'squircle' ? Math.round(size * 0.28) : size

  const dotColor =
    dot === 'offline' ? '#cfd4e2' : dot ? 'var(--color-lime-deep)' : null

  // Runtime geometry/colors ride in on custom properties; the rest is classes.
  const customProperties = {
    '--avatar-size': `${size}px`,
    '--avatar-radius': `${radius}px`,
    '--avatar-background': resolvedSrc
      ? `center/cover url(${resolvedSrc})`
      : background,
    '--avatar-ink': color,
    '--avatar-font-size': `${Math.max(10, Math.round(size * 0.36))}px`,
    '--avatar-border': border
      ? `${Math.max(2, size * 0.06)}px solid ${border}`
      : 'none',
    '--avatar-dot': dotColor ?? 'transparent',
    '--avatar-dot-size': `${Math.max(9, size * 0.23)}px`,
  } as CSSProperties

  return (
    <span
      className={cn(
        'relative grid size-(--avatar-size) flex-none place-items-center rounded-(--avatar-radius)',
        'text-(length:--avatar-font-size) font-semibold tracking-snug text-(color:--avatar-ink)',
        '[background:var(--avatar-background)] [border:var(--avatar-border)]',
        className,
      )}
      title={title}
      style={{ ...customProperties, ...style }}
    >
      {!resolvedSrc && label}
      {dotColor && (
        <span
          className={cn(
            'absolute size-(--avatar-dot-size)',
            'rounded-full border-2 border-white bg-(--avatar-dot)',
            shape === 'circle' ? 'bottom-px right-0' : 'bottom-0.5 right-0.5',
          )}
        />
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
    <div className="flex items-center">
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

import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Star } from 'lucide-react'

import { Button } from '#/components/ui'
import { formatCount } from '#/lib/format'
import { cn } from '#/lib/utils'

/**
 * "Message {owner}" — deep-links to the messages surface with the project
 * owner's conversation pre-selected (`/messages?dm=`). Falls back to a disabled
 * button when the owner is unknown.
 */
export function MessageOwnerButton({
  ownerId,
  ownerName,
  className,
}: {
  ownerId?: string | null
  ownerName?: string | null
  className?: string
}) {
  const first = ownerName?.split(' ')[0] ?? 'creator'
  if (!ownerId) {
    return (
      <Button variant="dark" className={className} disabled>
        Message {first}
      </Button>
    )
  }
  return (
    <Link
      to="/messages"
      search={{ dm: ownerId }}
      className={className}
    >
      <Button variant="dark" className="w-full">
        Message {first}
      </Button>
    </Link>
  )
}

/**
 * Star toggle for a project. Flips optimistically and bumps the displayed
 * count; the viewer's star is carried on `aria-pressed` so styling keys off
 * semantics. Persistence (a per-user star + recomputed `trendingScore`) is
 * tracked separately — this keeps the control live instead of inert.
 */
export function StarButton({
  count,
  className,
}: {
  count: number
  className?: string
}) {
  const [starred, setStarred] = useState(false)
  const shown = count + (starred ? 1 : 0)
  return (
    <button
      type="button"
      onClick={() => setStarred((v) => !v)}
      aria-pressed={starred}
      aria-label={starred ? 'Remove star' : 'Star this project'}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[13px] px-4 py-3',
        'text-note font-medium text-slate',
        'bg-lime/[0.22] transition-colors',
        'hover:bg-lime/30',
        'aria-pressed:bg-lime aria-pressed:text-ink',
        className,
      )}
    >
      <Star size={15} className={cn(starred && 'fill-current')} />{' '}
      {formatCount(shown)}
    </button>
  )
}

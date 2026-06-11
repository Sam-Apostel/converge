import type { VenueRoom } from '#/lib/queries/venue'
import { walkLabel } from './walk'

/** The lime-dot "◎ 4 min walk" chip used on room tiles and the next-up nudge. */
export function WalkChip({
  room,
  from,
  className = '',
}: {
  room: VenueRoom
  from?: VenueRoom
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-pillow px-2.5 py-1 text-[11.5px] font-medium text-slate ${className}`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-lime" />
      {walkLabel(room, from)}
    </span>
  )
}

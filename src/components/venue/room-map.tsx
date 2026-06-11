import { LiveDot, Mono } from '#/components/ui'
import type { VenueRoom } from '#/lib/queries/venue'
import { walkLabel } from './walk'

/** Ground = 0, "1" = 1 … so we can stack floors bottom-up on the schematic. */
function floorLevel(floor: string | null): number {
  if (!floor) return 0
  const n = Number.parseInt(floor, 10)
  return Number.isNaN(n) ? 0 : n
}

function floorName(floor: string | null): string {
  if (!floor || floor.toLowerCase() === 'ground') return 'Ground'
  return /^\d+$/.test(floor) ? `Floor ${floor}` : floor
}

/**
 * A soft schematic of the venue: floors stacked as bands (ground at the
 * bottom), rooms laid out left-to-right within each. A live room glows lime.
 * Deliberately not a real floorplan — just enough to orient an attendee.
 */
export function RoomMap({ rooms }: { rooms: Array<VenueRoom> }) {
  const floors = [...new Set(rooms.map((r) => r.floor ?? null))].sort(
    (a, b) => floorLevel(b) - floorLevel(a),
  )

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <Mono className="!text-[11px]">Venue map</Mono>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
          <LiveDot size={6} /> live now
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {floors.map((floor) => {
          const onFloor = rooms.filter((r) => (r.floor ?? null) === floor)
          return (
            <div
              key={floor ?? 'ground'}
              className="rounded-xl bg-inner px-3 py-2.5"
            >
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                {floorName(floor)}
              </div>
              <div className="flex flex-wrap gap-2">
                {onFloor.map((room) => {
                  const live = !!room.now
                  return (
                    <div
                      key={room.id}
                      className={`flex min-w-[112px] flex-1 flex-col gap-1 rounded-lg border px-2.5 py-2 transition-colors ${
                        live
                          ? 'border-lime/60 bg-lime/[0.14]'
                          : 'border-[rgba(120,130,180,.18)] bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {live && <LiveDot size={6} />}
                        <span className="truncate text-[12.5px] font-semibold tracking-[-0.01em]">
                          {room.name}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-muted">
                        {walkLabel(room)}
                        {room.capacity ? ` · ${room.capacity.toLocaleString()}` : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

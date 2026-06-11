import type { VenueRoom } from '#/lib/queries/venue'

/**
 * Deterministic walking-time stand-in.
 *
 * There's no live indoor positioning, so we estimate minutes from the venue
 * "hub" (registration / atrium) using the room's floor plus a stable per-room
 * jitter. Same room → same number every render. Replace with real venue
 * routing once floor plans exist.
 */
function hash(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/** Ground = 0, "1" = 1, "2" = 2 … unknown floors read as ground level. */
function floorLevel(floor: string | null): number {
  if (!floor) return 0
  const n = Number.parseInt(floor, 10)
  return Number.isNaN(n) ? 0 : n
}

/**
 * Minutes to walk to `room` (optionally *from* another room rather than the
 * hub). 2 min base + 2 min per floor climbed + 0–2 min jitter.
 */
export function walkMinutes(room: VenueRoom, from?: VenueRoom): number {
  const floors = from
    ? Math.abs(floorLevel(room.floor) - floorLevel(from.floor))
    : floorLevel(room.floor)
  const jitter = hash(from ? from.id + room.id : room.id) % 3
  return 2 + floors * 2 + jitter
}

/** "4 min walk" — pair with the lime ◎ dot chip used across the app. */
export function walkLabel(room: VenueRoom, from?: VenueRoom): string {
  return `${walkMinutes(room, from)} min walk`
}

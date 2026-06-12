import { Avatar, Badge, LiveDot, Mono } from '#/components/ui'
import type { VenueRoom, VenueSession } from '#/lib/queries/venue'
import { formatClock } from '#/lib/format'

/** What's-on line for a room — live talk (lime) or the next one queued up. */
function OnNow({ session, live }: { session: VenueSession; live: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      {session.speaker && (
        <Avatar
          name={session.speaker.name ?? '?'}
          src={session.speaker.image}
          size={32}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {live ? (
            <Badge tone="lime" mono className="!px-1.5 !py-0.5 !text-[9.5px]">
              <LiveDot size={5} /> LIVE
            </Badge>
          ) : (
            <Mono tone="ghost" className="!text-[10px]">
              {formatClock(session.startsAt)}
            </Mono>
          )}
          {session.track && (
            <span className="truncate text-[11px] text-faint">
              {session.track}
            </span>
          )}
        </div>
        <div className="truncate text-[13.5px] font-medium leading-snug text-ink">
          {session.title}
        </div>
        {session.speaker?.name && (
          <div className="truncate text-[11.5px] text-muted">
            {session.speaker.name}
          </div>
        )}
      </div>
    </div>
  )
}

/** A single room tile: name, floor·capacity, and what's on now/next. */
export function RoomTile({ room }: { room: VenueRoom }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card">
      <div>
        <div className="text-[15px] font-semibold tracking-[-0.01em]">
          {room.name}
        </div>
        <div className="mt-0.5 text-[12px] text-muted">
          {room.floor ? `Floor ${room.floor}` : 'Ground'}
          {room.capacity ? ` · seats ${room.capacity.toLocaleString()}` : ''}
        </div>
      </div>

      <div className="rounded-xl bg-inner p-3">
        {room.now ? (
          <OnNow session={room.now} live />
        ) : room.next ? (
          <>
            <Mono tone="faint" className="mb-1.5 block !text-[10px]">
              Up next
            </Mono>
            <OnNow session={room.next} live={false} />
          </>
        ) : (
          <div className="py-1 text-[12.5px] text-faint">
            No more sessions here today
          </div>
        )}
      </div>

      {room.now && room.next && (
        <div className="flex items-center gap-1.5 px-0.5 text-[11.5px] text-mist">
          <span className="text-faint">then</span>
          <span className="font-mono text-[10.5px] text-faint">
            {formatClock(room.next.startsAt)}
          </span>
          <span className="truncate">{room.next.title}</span>
        </div>
      )}
    </div>
  )
}

/** Grid of every room at the conference with its live / next programme. */
export function RoomList({ rooms }: { rooms: Array<VenueRoom> }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      {rooms.map((room) => (
        <RoomTile key={room.id} room={room} />
      ))}
    </div>
  )
}

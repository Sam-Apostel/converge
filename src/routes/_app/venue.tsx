import { createFileRoute } from '@tanstack/react-router'

import { Avatar, Mono, Spotlight } from '#/components/ui'
import { Billboard } from '#/components/venue/billboard'
import { RoomList } from '#/components/venue/room-list'
import { RoomMap } from '#/components/venue/room-map'
import { WalkChip } from '#/components/venue/walk-chip'
import { getVenue } from '#/lib/queries/venue'
import { formatClock } from '#/lib/format'

export const Route = createFileRoute('/_app/venue')({
  loader: () => getVenue(),
  component: VenuePage,
})

function VenuePage() {
  const venue = Route.useLoaderData()
  const where = venue.conference?.venueName ?? venue.conference?.name ?? null

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">
        Venue — the conference, live
      </h1>
      <p className="mb-5 mt-1 max-w-2xl text-[14.5px] text-mist">
        Rooms, walking times, and the billboard.{' '}
        {where ? `${where} · ` : ''}where ideas and people are the stars, not
        sponsor logos.
      </p>

      {venue.nextUp && <NextUp nextUp={venue.nextUp} />}

      <div className="mb-8 grid grid-cols-1 items-start gap-[22px] lg:grid-cols-[0.85fr_1.15fr]">
        <RoomMap rooms={venue.rooms} />
        <div>
          <Mono className="mb-3 block !text-[11px]">
            Rooms · what&rsquo;s on now
          </Mono>
          <RoomList rooms={venue.rooms} />
        </div>
      </div>

      <Billboard
        projects={venue.billboard.projects}
        discussions={venue.billboard.discussions}
        people={venue.billboard.people}
      />
    </div>
  )
}

/** "Your next session is in {room} · {walk}" — the wayfinding nudge. */
function NextUp({
  nextUp,
}: {
  nextUp: NonNullable<ReturnType<typeof Route.useLoaderData>['nextUp']>
}) {
  const { room, session } = nextUp
  return (
    <Spotlight glow="top-right" className="mb-6 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3.5">
          {session.speaker && (
            <Avatar
              name={session.speaker.name ?? '?'}
              src={session.speaker.image}
              size={44}
              border="#1c1e2e"
            />
          )}
          <div>
            <Mono tone="lime" className="!text-[10.5px]">
              Your next session
            </Mono>
            <div className="mt-1 text-[16px] font-semibold leading-snug tracking-[-0.01em]">
              {session.title}
            </div>
            <div className="mt-0.5 text-[12.5px] text-white/65">
              {formatClock(session.startsAt)} · {room.name}
              {session.speaker?.name ? ` · ${session.speaker.name}` : ''}
            </div>
          </div>
        </div>
        <WalkChip room={room} className="!bg-white/12 !text-white" />
      </div>
    </Spotlight>
  )
}

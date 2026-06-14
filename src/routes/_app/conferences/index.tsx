import { createFileRoute, useRouter } from '@tanstack/react-router'
import { CalendarDays, Check, MapPin } from 'lucide-react'

import { Button, Mono, Tag } from '#/components/ui'
import {
  getConferenceContext,
  setActiveConference,
} from '#/lib/queries/conferences'
import type { ConferenceSummary } from '#/lib/queries/conferences'

export const Route = createFileRoute('/_app/conferences/')({
  loader: () => getConferenceContext(),
  component: ConferencesPage,
})

function dateRange(startsAt: string | null, endsAt: string | null): string {
  if (!startsAt) return 'Dates to be confirmed'
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  }
  const start = new Date(startsAt).toLocaleDateString(undefined, opts)
  if (!endsAt) return start
  const end = new Date(endsAt)
  if (new Date(startsAt).toDateString() === end.toDateString()) return start
  return `${start} – ${end.toLocaleDateString(undefined, opts)}`
}

function ConferencesPage() {
  const { conferences, activeId } = Route.useLoaderData()
  const router = useRouter()
  const navigate = Route.useNavigate()

  const browse = async (id: string) => {
    await setActiveConference({ data: id })
    await router.invalidate()
    await navigate({ to: '/sessions' })
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">
          Conferences
        </h1>
        <p className="mt-1 max-w-2xl text-body text-mist">
          The events running at the summit. Pick one to make it active — the
          schedule, home, and concierge all follow your choice.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {conferences.map((conference) => (
          <ConferenceCard
            key={conference.id}
            conference={conference}
            active={conference.id === activeId}
            onBrowse={() => void browse(conference.id)}
          />
        ))}
      </div>
    </div>
  )
}

function ConferenceCard({
  conference,
  active,
  onBrowse,
}: {
  conference: ConferenceSummary
  active: boolean
  onBrowse: () => void
}) {
  return (
    <div
      className={`flex flex-col rounded-3xl bg-white p-6 shadow-card ${
        active ? 'ring-2 ring-lime/50' : ''
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-lg font-semibold text-white">
            {conference.name.charAt(0)}
          </span>
          <div>
            <h2 className="text-title font-semibold tracking-[-0.02em]">
              {conference.name}
            </h2>
            {conference.tagline ? (
              <p className="text-note text-muted">{conference.tagline}</p>
            ) : null}
          </div>
        </div>
        {active ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-lime/[0.22] px-2.5 py-1 font-mono text-tiny font-medium text-lime-deep">
            <Check size={12} strokeWidth={2.5} /> Active
          </span>
        ) : null}
      </div>

      <div className="mb-3.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-slate">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays size={13} className="text-muted" />
          {dateRange(conference.startsAt, conference.endsAt)}
        </span>
        {conference.venueName ? (
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={13} className="text-muted" />
            {conference.venueName}
          </span>
        ) : null}
      </div>

      <div className="mb-4 flex items-baseline gap-1.5 text-note text-slate">
        <span className="font-semibold text-ink">
          {conference.sessionCount}
        </span>
        talks across
        <span className="font-semibold text-ink">
          {conference.tracks.length || 1}
        </span>
        {conference.tracks.length === 1 ? 'track' : 'tracks'}
      </div>

      {conference.tracks.length > 0 ? (
        <>
          <Mono className="mb-2 block !text-tiny">Tracks</Mono>
          <div className="mb-5 flex flex-wrap gap-1.5">
            {conference.tracks.map((track) => (
              <Tag key={track} variant="soft">
                {track}
              </Tag>
            ))}
          </div>
        </>
      ) : null}

      <div className="mt-auto">
        <Button variant={active ? 'soft' : 'dark'} onClick={onBrowse}>
          {active ? 'Browse schedule' : 'Switch & browse schedule'}
        </Button>
      </div>
    </div>
  )
}

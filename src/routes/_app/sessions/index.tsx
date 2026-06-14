import { Link, createFileRoute } from '@tanstack/react-router'
import { CalendarDays, MapPin } from 'lucide-react'

import { Avatar, Mono, Pill, Tag } from '#/components/ui'
import { formatClock } from '#/lib/format'
import { listSessions } from '#/lib/queries'
import { getConferenceContext } from '#/lib/queries/conferences'
import { cn } from '#/lib/utils'

type SessionSearch = { track?: string }

export const Route = createFileRoute('/_app/sessions/')({
  validateSearch: (search: Record<string, unknown>): SessionSearch => ({
    track: typeof search.track === 'string' ? search.track : undefined,
  }),
  loader: async () => ({
    sessions: await listSessions(),
    context: await getConferenceContext(),
  }),
  component: SessionsPage,
})

type SessionRow = Awaited<ReturnType<typeof listSessions>>[number]

function dayLabel(value: string | Date | null): string {
  if (!value) return 'Unscheduled'
  return new Date(value).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

function isLiveNow(row: SessionRow): boolean {
  if (!row.startsAt || !row.endsAt) return false
  const now = Date.now()
  return (
    new Date(row.startsAt).getTime() <= now &&
    now <= new Date(row.endsAt).getTime()
  )
}

function SessionsPage() {
  const { sessions: allSessions, context } = Route.useLoaderData()
  const { track: activeTrack } = Route.useSearch()
  const navigate = Route.useNavigate()

  const active =
    context.conferences.find((c) => c.id === context.activeId) ??
    context.conferences[0]

  const now = new Date()
  const upcoming = allSessions.filter(
    (session) => session.endsAt != null && new Date(session.endsAt) > now,
  )

  // Tracks present in the upcoming schedule, with how many talks each holds.
  const trackCounts = new Map<string, number>()
  for (const s of upcoming) {
    if (s.track) trackCounts.set(s.track, (trackCounts.get(s.track) ?? 0) + 1)
  }
  const tracks = [...trackCounts.keys()].sort((a, b) => a.localeCompare(b))

  const sessions =
    activeTrack && tracks.includes(activeTrack)
      ? upcoming.filter((s) => s.track === activeTrack)
      : upcoming

  const selectTrack = (track: string | undefined) =>
    void navigate({ search: track ? { track } : {} })

  // Preserve the start-time order while grouping into day sections.
  const groups: Array<{ label: string; rows: Array<SessionRow> }> = []
  for (const row of sessions) {
    const label = dayLabel(row.startsAt)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.rows.push(row)
    else groups.push({ label, rows: [row] })
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {active ? `${active.name} — schedule` : 'Sessions'}
        </h1>
        <p className="mt-1 max-w-2xl text-body text-mist">
          Tap into any talk to bookmark slides, ask questions, and follow the
          discussion.
        </p>
        {active ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-slate">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={13} className="text-muted" />
              {dayLabel(active.startsAt)}
            </span>
            {active.venueName ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} className="text-muted" />
                {active.venueName}
              </span>
            ) : null}
          </div>
        ) : null}
      </header>

      {tracks.length > 1 ? (
        <div className="mb-6 flex flex-wrap gap-2">
          <button type="button" onClick={() => selectTrack(undefined)}>
            <Pill active={!activeTrack} elevated>
              All tracks
              <span className="text-tiny font-normal opacity-70">
                {upcoming.length}
              </span>
            </Pill>
          </button>
          {tracks.map((track) => (
            <button
              key={track}
              type="button"
              onClick={() => selectTrack(track)}
            >
              <Pill active={activeTrack === track} elevated>
                {track}
                <span className="text-tiny font-normal opacity-70">
                  {trackCounts.get(track)}
                </span>
              </Pill>
            </button>
          ))}
        </div>
      ) : null}

      {sessions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/10 bg-white/60 p-6 text-body text-muted">
          {activeTrack
            ? `No upcoming talks on the ${activeTrack} track.`
            : 'No sessions scheduled yet.'}
        </p>
      ) : (
        <div className="flex flex-col gap-7">
          {groups.map((group) => (
            <section key={group.label}>
              <Mono tone="faint" className="mb-3 block text-caption">
                {group.label}
              </Mono>
              <ul className="flex flex-col gap-2">
                {group.rows.map((row) => {
                  const live = isLiveNow(row)
                  return (
                    <li key={row.id}>
                      <Link
                        to="/sessions/$slug"
                        params={{ slug: row.slug }}
                        data-live={live || undefined}
                        className={cn(
                          'group flex items-center gap-4 px-4 py-3.5',
                          'rounded-2xl bg-white shadow-card',
                          'transition-[transform,box-shadow] duration-150',
                          'hover:-translate-y-px hover:shadow-card-hover',
                          'data-live:bg-ink-gradient data-live:text-white',
                        )}
                      >
                        <div className="flex w-[68px] shrink-0 flex-col items-start gap-1">
                          <span
                            className={cn(
                              'font-mono text-note font-semibold tabular-nums text-ink',
                              'group-data-live:text-white',
                            )}
                          >
                            {formatClock(row.startsAt)}
                          </span>
                          {row.endsAt ? (
                            <span
                              className={cn(
                                'font-mono text-tiny tabular-nums text-faint',
                                'group-data-live:text-frost',
                              )}
                            >
                              {formatClock(row.endsAt)}
                            </span>
                          ) : null}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'truncate font-semibold tracking-snug text-ink',
                              'group-data-live:text-white',
                            )}
                          >
                            {row.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {row.track ? (
                              <Tag variant="soft">{row.track}</Tag>
                            ) : null}
                            {row.roomName ? (
                              <span className="text-caption text-mist group-data-live:text-frost">
                                {row.roomName}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {row.speakerName ? (
                          <div className="hidden shrink-0 items-center gap-2.5 sm:flex">
                            <div className="text-right">
                              <div className="text-note font-medium text-slate group-data-live:text-frost">
                                {row.speakerName}
                              </div>
                            </div>
                            <Avatar
                              name={row.speakerName}
                              size={34}
                              {...(live ? { bg: '#3a3f5c', ink: '#fff' } : {})}
                            />
                          </div>
                        ) : null}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

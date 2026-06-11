import { Link, createFileRoute } from '@tanstack/react-router'

import { Avatar, Badge, LiveDot, Mono, Tag } from '#/components/ui'
import { formatClock } from '#/lib/format'
import { listSessions } from '#/lib/queries'

export const Route = createFileRoute('/_app/sessions/')({
  loader: () => listSessions(),
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
  const sessions = Route.useLoaderData()

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
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">Sessions</h1>
        <p className="mt-1 max-w-2xl text-[14.5px] text-mist">
          The schedule — tap into any talk to bookmark slides, ask questions,
          and follow the discussion.
        </p>
      </header>

      {sessions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/10 bg-white/60 p-6 text-sm text-muted">
          No sessions scheduled yet.
        </p>
      ) : (
        <div className="flex flex-col gap-7">
          {groups.map((group) => (
            <section key={group.label}>
              <Mono tone="faint" className="mb-3 block text-[12px]">
                {group.label}
              </Mono>
              <ul className="flex flex-col gap-2">
                {group.rows.map((row) => {
                  const live = isLiveNow(row)
                  return (
                    <li key={row.id}>
                      <Link
                        to="/sessions/$sessionId"
                        params={{ sessionId: row.id }}
                        className="group flex items-center gap-4 rounded-2xl bg-white px-4 py-3.5 shadow-card transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-card-hover"
                      >
                        <div className="flex w-[68px] shrink-0 flex-col items-start gap-1">
                          <span className="font-mono text-[13px] font-semibold tabular-nums text-ink">
                            {formatClock(row.startsAt)}
                          </span>
                          {live ? (
                            <Badge tone="lime-soft" mono className="gap-1 px-2">
                              <LiveDot size={6} /> Live
                            </Badge>
                          ) : row.endsAt ? (
                            <span className="font-mono text-[11px] tabular-nums text-faint">
                              {formatClock(row.endsAt)}
                            </span>
                          ) : null}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold tracking-[-0.01em] text-ink">
                            {row.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {row.track ? (
                              <Tag variant="soft">{row.track}</Tag>
                            ) : null}
                            {row.roomName ? (
                              <span className="text-[12.5px] text-mist">
                                {row.roomName}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {row.speakerName ? (
                          <div className="hidden shrink-0 items-center gap-2.5 sm:flex">
                            <div className="text-right">
                              <div className="text-[13px] font-medium text-slate">
                                {row.speakerName}
                              </div>
                            </div>
                            <Avatar name={row.speakerName} size={34} />
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

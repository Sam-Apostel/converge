import { Link, createFileRoute } from '@tanstack/react-router'

import { Avatar, Mono, Tag } from '#/components/ui'
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

  const now = new Date()
  const sessions = Route.useLoaderData().filter(
    (session) => session.endsAt != null && new Date(session.endsAt) > now,
  )

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
                        className={
                          live
                            ? 'group flex items-center gap-4 rounded-2xl px-4 py-3.5 text-white shadow-card transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-card-hover'
                            : 'group flex items-center gap-4 rounded-2xl bg-white px-4 py-3.5 shadow-card transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-card-hover'
                        }
                        style={
                          live
                            ? { background: 'linear-gradient(135deg,#13141d,#1c1e2e)' }
                            : undefined
                        }
                      >
                        <div className="flex w-[68px] shrink-0 flex-col items-start gap-1">
                          <span
                            className={`font-mono text-[13px] font-semibold tabular-nums ${live ? 'text-white' : 'text-ink'}`}
                          >
                            {formatClock(row.startsAt)}
                          </span>
                          {row.endsAt ? (
                            <span
                              className={`font-mono text-[11px] tabular-nums ${live ? 'text-[#d6d8e6]' : 'text-faint'}`}
                            >
                              {formatClock(row.endsAt)}
                            </span>
                          ) : null}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate font-semibold tracking-[-0.01em] ${live ? 'text-white' : 'text-ink'}`}
                          >
                            {row.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {row.track ? (
                              <Tag variant="soft">{row.track}</Tag>
                            ) : null}
                            {row.roomName ? (
                              <span
                                className={`text-[12.5px] ${live ? 'text-[#d6d8e6]' : 'text-mist'}`}
                              >
                                {row.roomName}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {row.speakerName ? (
                          <div className="hidden shrink-0 items-center gap-2.5 sm:flex">
                            <div className="text-right">
                              <div
                                className={`text-[13px] font-medium ${live ? 'text-[#d6d8e6]' : 'text-slate'}`}
                              >
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

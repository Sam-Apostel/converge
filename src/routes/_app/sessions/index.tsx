import { Link, createFileRoute } from '@tanstack/react-router'

import { PageHeader } from '#/components/page-header'
import { listSessions } from '#/lib/queries'

export const Route = createFileRoute('/_app/sessions/')({
  loader: () => listSessions(),
  component: SessionsPage,
})

function formatTime(value: string | Date | null) {
  if (!value) return 'TBA'
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toLocaleString(undefined, {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SessionsPage() {
  const sessions = Route.useLoaderData()

  return (
    <div>
      <PageHeader
        title="Sessions"
        subtitle="The schedule — tap into any talk to bookmark moments, ask questions, and follow the discussion."
      />

      {sessions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/10 bg-white/60 p-6 text-sm text-muted">
          No sessions scheduled yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sessions.map((session) => (
            <li key={session.id}>
              <Link
                to="/sessions/$sessionId"
                params={{ sessionId: session.id }}
                className="flex items-center justify-between gap-4 rounded-xl border border-black/5 bg-white/70 px-4 py-3 transition-colors hover:bg-brand-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{session.title}</p>
                  {session.track ? (
                    <p className="truncate text-sm text-muted">{session.track}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-sm tabular-nums text-muted">
                  {formatTime(session.startsAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

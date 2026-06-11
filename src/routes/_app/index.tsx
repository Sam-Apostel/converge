import { Link, createFileRoute } from '@tanstack/react-router'
import { BorderBeam } from 'border-beam'
import { CalendarClock, Rocket, Users } from 'lucide-react'

import { getHomeSummary } from '#/lib/queries'

export const Route = createFileRoute('/_app/')({
  loader: () => getHomeSummary(),
  component: Home,
})

function Home() {
  const summary = Route.useLoaderData()

  const stats = [
    { label: 'People', value: summary.people, to: '/people', icon: Users },
    { label: 'Projects', value: summary.projects, to: '/projects', icon: Rocket },
    {
      label: 'Sessions',
      value: summary.sessions,
      to: '/sessions',
      icon: CalendarClock,
    },
  ]

  return (
    <div className="flex flex-col gap-7">
      {/* Hero — uses border-beam for a little special-occasion shine. */}
      <BorderBeam colorVariant="colorful" size="md">
        <section className="rounded-2xl bg-ink p-8 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-100/80">
            The conference companion
          </p>
          <h1 className="mt-2 max-w-2xl text-3xl font-semibold leading-tight">
            Discover the right people, capture the moments that matter, and keep
            the conversation going long after the event ends.
          </h1>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/people"
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-ink transition-transform hover:scale-[0.98]"
            >
              Find people
            </Link>
            <Link
              to="/concierge"
              className="rounded-xl border border-white/25 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Ask the AI concierge
            </Link>
          </div>
        </section>
      </BorderBeam>

      {/* What should I do right now? */}
      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, to, icon: Icon }) => (
          <Link
            key={label}
            to={to}
            className="group rounded-2xl border border-black/5 bg-white/70 p-5 transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted">{label}</span>
              <Icon size={18} className="text-brand-500" />
            </div>
            <div className="mt-3 text-3xl font-semibold tabular-nums">{value}</div>
          </Link>
        ))}
      </section>

      {/* Next session */}
      <section className="rounded-2xl border border-black/5 bg-white/70 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Next session
        </h2>
        {summary.nextSession ? (
          <div className="mt-3">
            <p className="text-lg font-medium">{summary.nextSession.title}</p>
            {summary.nextSession.track ? (
              <p className="text-sm text-muted">{summary.nextSession.track}</p>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">
            No sessions scheduled yet. Seed a conference to get started.
          </p>
        )}
      </section>
    </div>
  )
}

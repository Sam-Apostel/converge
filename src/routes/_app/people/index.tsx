import { Link, createFileRoute } from '@tanstack/react-router'
import { Avatar } from '@progress/kendo-react-layout'

import { PageHeader } from '#/components/page-header'
import { listPeople } from '#/lib/queries'

export const Route = createFileRoute('/_app/people/')({
  loader: () => listPeople(),
  component: PeoplePage,
})

function PeoplePage() {
  const people = Route.useLoaderData()

  return (
    <div>
      <PageHeader
        title="People"
        subtitle="People before sessions. Discover who's here, what they're building, and the conversations they want."
      />

      {people.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/10 bg-white/60 p-6 text-sm text-muted">
          No attendees yet.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((person) => (
            <li key={person.id}>
              <Link
                to="/people/$userId"
                params={{ userId: person.id }}
                className="flex h-full items-start gap-3 rounded-2xl border border-black/5 bg-white/70 p-4 transition-transform hover:-translate-y-0.5"
              >
                <Avatar type="text" themeColor="primary" rounded="full" size="large">
                  {(person.name ?? '?').charAt(0)}
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">{person.name}</p>
                  <p className="truncate text-sm text-muted">
                    {person.profile?.headline ?? person.profile?.title ?? '—'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(person.profile?.intents ?? []).slice(0, 2).map((intent) => (
                      <span
                        key={intent}
                        className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
                      >
                        {intent}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

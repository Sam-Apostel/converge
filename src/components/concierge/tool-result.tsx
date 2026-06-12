import { Link } from '@tanstack/react-router'

import { Avatar, Mono } from '#/components/ui'

/**
 * Inline rendering of a concierge tool result (silo 7).
 *
 * The server tools (`src/lib/concierge/tools.ts`) return compact, UI-friendly
 * shapes. We branch on the keys present in the parsed output so the answer is
 * interactive — people become avatar rows, sessions and projects become rows.
 */

type PersonRow = {
  id: string
  name: string
  image?: string | null
  headline?: string | null
  company?: string | null
  currentFocus?: string | null
}

type SessionRow = {
  id: string
  title: string
  track?: string | null
  startsAt?: string | null
}

type ProjectRow = {
  id: string
  slug: string
  name: string
  tagline?: string | null
  category?: string | null
}

function formatTime(iso?: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString(undefined, {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ResultShell({
  label,
  count,
  children,
}: {
  label: string
  count?: number
  children: React.ReactNode
}) {
  return (
    <div className="mt-2 rounded-2xl border border-line bg-surface p-3 shadow-card">
      <div className="mb-2 flex items-center gap-2 px-1">
        <Mono tone="faint">{label}</Mono>
        {typeof count === 'number' ? (
          <span className="font-mono text-[11px] text-faint tabular-nums">
            {count}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  )
}

function PeopleResult({ people }: { people: Array<PersonRow> }) {
  if (people.length === 0) {
    return (
      <ResultShell label="People">
        {<EmptyRow text="No matching people." />}
      </ResultShell>
    )
  }
  return (
    <ResultShell label="People" count={people.length}>
      <ul className="flex flex-col gap-1">
        {people.slice(0, 8).map((p) => (
          <li key={p.id}>
            <Link
              to="/people/$userId"
              params={{ userId: p.id }}
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-pillow"
            >
              <Avatar name={p.name} src={p.image} size={34} />
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-medium text-ink">
                  {p.name}
                </span>
                <span className="block truncate text-[12.5px] text-mist">
                  {p.headline ?? p.currentFocus ?? p.company ?? '—'}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </ResultShell>
  )
}

function SessionsResult({ sessions }: { sessions: Array<SessionRow> }) {
  if (sessions.length === 0) {
    return (
      <ResultShell label="Sessions">
        <EmptyRow text="Nothing on the schedule for that." />
      </ResultShell>
    )
  }
  return (
    <ResultShell label="Sessions" count={sessions.length}>
      <ul className="flex flex-col gap-1">
        {sessions.slice(0, 8).map((s) => (
          <li key={s.id}>
            <Link
              to="/sessions/$sessionId"
              params={{ sessionId: s.id }}
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-pillow"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium text-ink">
                  {s.title}
                </span>
                <span className="block truncate text-[12.5px] text-mist">
                  {[formatTime(s.startsAt), s.track]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </ResultShell>
  )
}

function ProjectsResult({ projects }: { projects: Array<ProjectRow> }) {
  if (projects.length === 0) {
    return (
      <ResultShell label="Projects">
        <EmptyRow text="No matching projects." />
      </ResultShell>
    )
  }
  return (
    <ResultShell label="Projects" count={projects.length}>
      <ul className="flex flex-col gap-1">
        {projects.slice(0, 8).map((p) => (
          <li key={p.id}>
            <Link
              to="/projects/$slug"
              params={{ slug: p.slug }}
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-pillow"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium text-ink">
                  {p.name}
                </span>
                <span className="block truncate text-[12.5px] text-mist">
                  {p.tagline ?? p.category ?? '—'}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </ResultShell>
  )
}

function ProfileResult({
  person,
}: {
  person: PersonRow & { bio?: string | null }
}) {
  return (
    <ResultShell label="Profile">
      <div className="flex items-start gap-3 px-1">
        <Avatar name={person.name} src={person.image} size={44} />
        <div className="min-w-0">
          <Link
            to="/people/$userId"
            params={{ userId: person.id }}
            className="block truncate text-[15px] font-semibold text-ink hover:underline"
          >
            {person.name}
          </Link>
          {person.headline ? (
            <p className="text-[13px] text-mist">{person.headline}</p>
          ) : null}
          {person.bio ? (
            <p className="mt-1 line-clamp-3 text-[13px] text-slate">
              {person.bio}
            </p>
          ) : null}
        </div>
      </div>
    </ResultShell>
  )
}

function EmptyRow({ text }: { text: string }) {
  return <p className="px-2 py-1 text-[13px] text-muted">{text}</p>
}

/**
 * Render a tool result by inspecting the parsed output shape. Returns `null`
 * for shapes we don't have a card for (the model's prose still covers them).
 */
export function ToolResult({ output }: { output: unknown }) {
  if (!output || typeof output !== 'object') return null
  const o = output as Record<string, unknown>

  if (Array.isArray(o.people)) {
    return <PeopleResult people={o.people as Array<PersonRow>} />
  }
  if (Array.isArray(o.sessions)) {
    return <SessionsResult sessions={o.sessions as Array<SessionRow>} />
  }
  if (Array.isArray(o.projects)) {
    return <ProjectsResult projects={o.projects as Array<ProjectRow>} />
  }
  if (o.person && typeof o.person === 'object') {
    return (
      <ProfileResult person={o.person as PersonRow & { bio?: string | null }} />
    )
  }
  return null
}

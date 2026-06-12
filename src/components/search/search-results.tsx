import { Link } from '@tanstack/react-router'
import { ArrowRight, Clock, MessagesSquare } from 'lucide-react'
import type { ReactNode } from 'react'

import { Avatar, Mono } from '#/components/ui'
import type { SearchResult, SearchResultType } from '#/lib/queries/search'

/** Display order + section label for each entity group. */
const GROUPS: Array<{ type: SearchResultType; label: string }> = [
  { type: 'person', label: 'People' },
  { type: 'project', label: 'Projects' },
  { type: 'session', label: 'Sessions' },
  { type: 'discussion', label: 'Discussions' },
]

/** Grouped, typed result rows — each links to its detail route. */
export function SearchResults({ results }: { results: SearchResult[] }) {
  return (
    <div className="flex flex-col gap-6">
      {GROUPS.map(({ type, label }) => {
        const rows = results.filter((r) => r.type === type)
        if (rows.length === 0) return null
        return (
          <section key={type}>
            <Mono className="mb-2.5 block !text-caption !tracking-[0.12em]">
              {label}
              <span className="ml-2 text-muted">{rows.length}</span>
            </Mono>
            <div className="flex flex-col gap-1.5">
              {rows.map((r) => (
                <ResultRow key={`${r.type}-${r.id}`} result={r} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function ResultRow({ result }: { result: SearchResult }) {
  return (
    <ResultLink result={result}>
      <Leading result={result} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-reading font-medium tracking-[-0.01em] text-ink">
          {result.title}
        </div>
        {result.subtitle ? (
          <div className="truncate text-note text-mist">{result.subtitle}</div>
        ) : null}
      </div>
      <ArrowRight
        size={16}
        className="text-muted transition-transform group-hover:translate-x-0.5"
      />
    </ResultLink>
  )
}

const ROW_CLASS =
  'group flex items-center gap-3.5 rounded-2xl bg-white px-4 py-3 shadow-card transition-transform hover:-translate-y-0.5'

/** Switch to the typed detail Link for this result's entity. */
function ResultLink({
  result,
  children,
}: {
  result: SearchResult
  children: ReactNode
}) {
  switch (result.type) {
    case 'person':
      return (
        <Link
          to="/people/$userId"
          params={{ userId: result.id }}
          className={ROW_CLASS}
        >
          {children}
        </Link>
      )
    case 'project':
      return (
        <Link
          to="/projects/$slug"
          params={{ slug: result.id }}
          className={ROW_CLASS}
        >
          {children}
        </Link>
      )
    case 'session':
      return (
        <Link
          to="/sessions/$slug"
          params={{ slug: result.id }}
          className={ROW_CLASS}
        >
          {children}
        </Link>
      )
    case 'discussion':
      return (
        <Link
          to="/discussions/$id"
          params={{ id: result.id }}
          className={ROW_CLASS}
        >
          {children}
        </Link>
      )
  }
}

/** People/projects get an Avatar; sessions/discussions a mono glyph marker. */
function Leading({ result }: { result: SearchResult }) {
  if (result.type === 'person' || result.type === 'project') {
    return (
      <Avatar
        name={result.title}
        size={36}
        shape={result.type === 'project' ? 'squircle' : 'circle'}
      />
    )
  }
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-pillow text-slate shadow-soft">
      {result.type === 'session' ? (
        <Clock size={16} />
      ) : (
        <MessagesSquare size={16} />
      )}
    </span>
  )
}

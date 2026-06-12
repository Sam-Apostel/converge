import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { PageHeader } from '#/components/page-header'
import { SearchInput } from '#/components/search/search-input'
import { SearchResults } from '#/components/search/search-results'
import { searchAll } from '#/lib/queries/search'
import type { SearchResult } from '#/lib/queries/search'

/** A few starter queries for the empty state. */
const SUGGESTIONS = ['AI', 'React', 'co-founder', 'design', 'open-source']

export const Route = createFileRoute('/_app/search')({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === 'string' ? search.q : '',
  }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  // SSR the initial results when arriving with `?q=…`.
  loader: ({ deps }) => searchAll({ data: deps.q }),
  component: SearchPage,
})

function SearchPage() {
  const { q: initialQuery } = Route.useSearch()
  const initialResults = Route.useLoaderData()

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>(initialResults)
  const [loading, setLoading] = useState(false)
  // Track what the current `results` reflect, so we don't refetch the SSR query.
  const lastFetched = useRef(initialQuery)

  // Debounced type-as-you-go fetch against the API route.
  useEffect(() => {
    if (query.trim() === lastFetched.current.trim()) return
    let ignore = false
    setLoading(true)
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        const data = (await res.json()) as SearchResult[]
        if (ignore) return
        lastFetched.current = query
        setResults(data)
      } finally {
        if (!ignore) setLoading(false)
      }
    }, 180)
    return () => {
      ignore = true
      clearTimeout(handle)
    }
  }, [query])

  const trimmed = query.trim()
  const hasResults = results.length > 0

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-7">
      <PageHeader
        title="Search"
        subtitle="One search across people, projects, sessions and discussions."
      />

      <SearchInput value={query} onChange={setQuery} />

      {trimmed === '' ? (
        <EmptyState onPick={setQuery} />
      ) : hasResults ? (
        <SearchResults results={results} />
      ) : loading ? (
        <p className="px-1 text-[14px] text-mist">Searching…</p>
      ) : (
        <p className="px-1 text-[14px] text-mist">
          No matches for “{trimmed}”.
        </p>
      )}
    </div>
  )
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <p className="text-[14px] text-mist">
        Start typing to search the whole conference — or try one of these:
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="rounded-full border border-[rgba(120,130,180,.16)] bg-white px-3.5 py-2 text-[13px] font-medium text-ink-2 shadow-soft transition-transform hover:scale-[0.98]"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { Check, ChevronDown, LayoutGrid } from 'lucide-react'

import { setActiveConference } from '#/lib/queries/conferences'
import type { ConferenceSummary } from '#/lib/queries/conferences'

function shortName(name: string): string {
  // "React Summit Amsterdam 2026" → "React Summit"; drop a trailing year/city.
  return name
    .replace(/\s+(Amsterdam|Berlin|London|US|EU)?\s*\d{4}$/i, '')
    .trim()
}

/** Date range like "11 Jun" or "11–12 Jun". */
function dateRange(startsAt: string | null, endsAt: string | null): string {
  if (!startsAt) return 'Dates TBC'
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  const start = new Date(startsAt)
  if (!endsAt) return start.toLocaleDateString(undefined, opts)
  const end = new Date(endsAt)
  const sameMonth = start.getMonth() === end.getMonth()
  if (start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString(undefined, opts)
  }
  const startLabel = sameMonth
    ? String(start.getDate())
    : start.toLocaleDateString(undefined, opts)
  return `${startLabel}–${end.toLocaleDateString(undefined, opts)}`
}

/**
 * Header control for switching the active conference. The whole app shows one
 * conference at a time; choosing here persists the selection (cookie) and
 * re-runs every loader via `router.invalidate()`.
 */
export function ConferenceSwitcher({
  conferences,
  activeId,
  compact = false,
}: {
  conferences: Array<ConferenceSummary>
  activeId: string | null
  compact?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (conferences.length === 0) return null

  const active = conferences.find((c) => c.id === activeId) ?? conferences[0]

  const choose = async (id: string) => {
    if (id !== active.id) {
      setPending(id)
      try {
        await setActiveConference({ data: id })
        await router.invalidate()
      } finally {
        setPending(null)
      }
    }
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-white/60 bg-white/55 py-1.5 pl-3 pr-2.5 text-note font-semibold text-ink shadow-soft transition-colors hover:bg-white"
      >
        <span className="grid h-5 w-5 place-items-center rounded-md bg-ink text-white">
          {active.name.charAt(0)}
        </span>
        <span className={compact ? 'max-w-[120px] truncate' : ''}>
          {shortName(active.name)}
        </span>
        <ChevronDown
          size={15}
          className={`text-slate transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-[280px] origin-top-right overflow-hidden rounded-2xl border border-black/5 bg-white p-1.5 shadow-card-lg"
        >
          <div className="px-2.5 py-1.5 font-mono text-tiny uppercase tracking-[0.12em] text-faint">
            Switch conference
          </div>
          {conferences.map((c) => {
            const isActive = c.id === active.id
            return (
              <button
                key={c.id}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => void choose(c.id)}
                disabled={pending !== null}
                className={`flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors ${
                  isActive ? 'bg-inner' : 'hover:bg-inner'
                }`}
              >
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ink text-note font-semibold text-white">
                  {c.name.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-semibold text-ink">
                    {shortName(c.name)}
                  </span>
                  <span className="block truncate text-caption text-muted">
                    {dateRange(c.startsAt, c.endsAt)} · {c.sessionCount} talks
                    {c.tracks.length > 1 ? ` · ${c.tracks.length} tracks` : ''}
                  </span>
                </span>
                {isActive ? (
                  <Check
                    size={16}
                    strokeWidth={2.5}
                    className="mt-1 shrink-0 text-lime-deep"
                  />
                ) : null}
              </button>
            )
          })}
          <Link
            to="/conferences"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center gap-2 rounded-xl px-2.5 py-2 text-note font-medium text-slate transition-colors hover:bg-inner hover:text-ink"
          >
            <LayoutGrid size={15} /> Browse all conferences
          </Link>
        </div>
      ) : null}
    </div>
  )
}

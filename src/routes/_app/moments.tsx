import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight, Star } from 'lucide-react'

import { Mono } from '#/components/ui'
import { PageHeader } from '#/components/page-header'
import { listMyMoments } from '#/lib/queries'
import type { MyMoment } from '#/lib/queries'
import { formatOffset } from '#/components/session/slides'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/_app/moments')({
  loader: () => listMyMoments(),
  component: MomentsPage,
})

function MomentsPage() {
  const moments = Route.useLoaderData()

  // Group by talk so the review reads as "what I kept from each session".
  const bySession = new Map<
    string,
    { title: string; slug: string; items: Array<MyMoment> }
  >()
  for (const m of moments) {
    const group = bySession.get(m.sessionSlug) ?? {
      title: m.sessionTitle,
      slug: m.sessionSlug,
      items: [],
    }
    group.items.push(m)
    bySession.set(m.sessionSlug, group)
  }
  const groups = [...bySession.values()]

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Your moments"
        subtitle="Every passage you bookmarked, across all your sessions. Jump back to the exact second."
      />

      {groups.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-edge/40 bg-white/60 p-6 text-body text-muted">
          You haven't captured any moments yet. Tap the bookmark during a talk
          and they'll collect here.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.slug}>
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <h2 className="text-body font-semibold tracking-snug">
                  {group.title}
                </h2>
                <Link
                  to="/sessions/$slug"
                  params={{ slug: group.slug }}
                  className="inline-flex items-center gap-1 text-caption font-medium text-muted transition-colors hover:text-ink"
                >
                  Open talk <ArrowRight size={13} />
                </Link>
              </div>
              <ul className="flex flex-col gap-2">
                {group.items.map((m) => (
                  <li
                    key={m.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3',
                      'rounded-xl bg-white shadow-soft',
                    )}
                  >
                    <Link
                      to="/sessions/$slug"
                      params={{ slug: m.sessionSlug }}
                      className="shrink-0 pt-0.5 font-mono text-caption text-slate transition-colors hover:text-ink"
                    >
                      {formatOffset(m.timestampMs)}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="text-note text-ink-soft">
                        {m.transcriptSnippet ?? m.slideRef ?? 'Bookmarked moment'}
                      </div>
                      {m.note && (
                        <div className="mt-1 text-caption italic text-mist">
                          “{m.note}”
                        </div>
                      )}
                    </div>
                    {m.aiHighlight && (
                      <Star
                        size={14}
                        className="mt-0.5 shrink-0 fill-lime text-lime"
                        aria-label="AI highlight"
                      />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="py-14 text-center">
        <Mono tone="ghost" className="!text-caption !tracking-[0.04em]">
          Moments instead of photos.
        </Mono>
      </div>
    </div>
  )
}

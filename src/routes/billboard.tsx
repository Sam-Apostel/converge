import { createFileRoute, useRouter } from '@tanstack/react-router'

import { Avatar, Mono, Tag } from '#/components/ui'
import {
  listHighlightMoments,
  listPeople,
  listProjects,
  listSessions,
} from '#/lib/queries'
import { listDiscussions } from '#/lib/queries/discussions'
import { useEventStream } from '#/hooks/use-event-stream'
import { formatClock, formatCount } from '#/lib/format'
import { cn } from '#/lib/utils'

/**
 * Full-screen ambient display for venue screens / a second monitor. Lives
 * outside the `_app` shell (no nav, no sidebar) so it reads clean from across a
 * room. Subscribes to the SSE stream and re-loads on any activity, so trending
 * projects, available people and the schedule stay current without a reload.
 */
export const Route = createFileRoute('/billboard')({
  loader: async () => {
    const [projects, people, sessions, discussions, highlights] =
      await Promise.all([
        listProjects(),
        listPeople(),
        listSessions(),
        listDiscussions(),
        listHighlightMoments({ data: { limit: 5 } }),
      ])
    return { projects, people, sessions, discussions, highlights }
  },
  component: Billboard,
})

function Billboard() {
  const { projects, people, sessions, discussions, highlights } =
    Route.useLoaderData()
  const router = useRouter()

  // Any conference activity (new moment, question, discussion post…) re-loads
  // the board. EventSource + this hook handle reconnection on a drop.
  useEventStream({ onEvent: () => router.invalidate() })

  const now = Date.now()
  const trending = projects.slice(0, 6)
  const available = people
    .filter((p) => p.profile?.availability === 'open')
    .slice(0, 8)
  const upcoming = sessions
    .filter((s) => s.startsAt && new Date(s.startsAt).getTime() >= now)
    .slice(0, 3)
  const channels = discussions.channels.slice(0, 5)

  return (
    <div className="min-h-screen bg-ink-gradient px-[4vw] py-[3vw] text-white">
      <header className="mb-[3vw] flex items-center justify-between">
        <div className="text-[2.4vw] font-semibold tracking-tighter">
          converge
        </div>
        <div className="flex items-center gap-3">
          <span className="size-3 animate-live-pulse rounded-full bg-lime" />
          <Mono tone="lime" className="!text-[1.1vw] !tracking-[0.14em]">
            Live at the summit
          </Mono>
        </div>
      </header>

      <div className="grid grid-cols-[1.6fr_1fr] gap-[3vw]">
        {/* Trending projects — the headline column */}
        <section>
          <SectionLabel>Trending projects</SectionLabel>
          <div className="flex flex-col gap-[1.4vw]">
            {trending.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-[1.6vw] border-b border-white/10 pb-[1.4vw]"
              >
                <Avatar
                  name={p.name}
                  initials={p.name.slice(0, 2)}
                  shape="squircle"
                  size={64}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[1.7vw] font-semibold leading-tight tracking-tight">
                    {p.name}
                  </div>
                  <div className="truncate text-[1.05vw] text-frost">
                    {p.tagline ?? p.ownerName}
                  </div>
                  <div className="mt-[0.5vw] flex flex-wrap gap-1.5">
                    {(p.techStack ?? []).slice(0, 4).map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[1.8vw] font-semibold text-lime">
                    {formatCount(p.trendingScore)}
                  </div>
                  <Mono className="!text-[0.8vw]">watching</Mono>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-[2.4vw]">
          {/* People available now */}
          <section>
            <SectionLabel>Open to meet right now</SectionLabel>
            <div className="flex flex-col gap-[1vw]">
              {available.length === 0 && (
                <p className="text-[1.1vw] text-frost">
                  Everyone's heads-down. Check back soon.
                </p>
              )}
              {available.map((p) => (
                <div key={p.id} className="flex items-center gap-[1vw]">
                  <Avatar name={p.name} src={p.image} size={48} />
                  <div className="min-w-0">
                    <div className="truncate text-[1.2vw] font-semibold leading-tight">
                      {p.name}
                    </div>
                    <div className="truncate text-[0.95vw] text-frost">
                      {p.profile?.intents?.[0] ??
                        p.profile?.headline ??
                        'At the conference'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Upcoming sessions */}
          <section>
            <SectionLabel>Up next on stage</SectionLabel>
            <div className="flex flex-col gap-[1vw]">
              {upcoming.length === 0 && (
                <p className="text-[1.1vw] text-frost">
                  No more sessions scheduled.
                </p>
              )}
              {upcoming.map((s) => (
                <div key={s.id} className="flex items-baseline gap-[1vw]">
                  <Mono tone="lime" className="!text-[1vw] shrink-0">
                    {formatClock(s.startsAt)}
                  </Mono>
                  <div className="min-w-0">
                    <div className="truncate text-[1.2vw] font-semibold leading-tight">
                      {s.title}
                    </div>
                    <div className="truncate text-[0.9vw] text-frost">
                      {[s.speakerName, s.roomName].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Live moment activity */}
          {highlights.length > 0 && (
            <section>
              <SectionLabel>Moments people are saving</SectionLabel>
              <div className="flex flex-col gap-[0.9vw]">
                {highlights.map((h) => (
                  <div key={h.id} className="min-w-0">
                    <div className="truncate text-[1.1vw] font-medium leading-tight">
                      {h.transcriptSnippet ?? 'Key moment'}
                    </div>
                    <div className="truncate text-[0.85vw] text-frost">
                      {h.sessionTitle} · {h.capturedByName}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Active discussions */}
          {channels.length > 0 && (
            <section>
              <SectionLabel>Buzzing channels</SectionLabel>
              <div className="flex flex-wrap gap-[0.8vw]">
                {channels.map((c) => (
                  <span
                    key={c.topic}
                    className="rounded-full bg-white/10 px-[1.1vw] py-[0.5vw] text-[1vw] font-medium"
                  >
                    #{c.topic}{' '}
                    <span className="text-lime">{c.posts}</span>
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Mono
      tone="lime"
      className={cn('mb-[1.2vw] block !text-[1vw] !tracking-[0.14em]')}
    >
      {children}
    </Mono>
  )
}

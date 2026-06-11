import { Link, createFileRoute } from '@tanstack/react-router'

import {
  Avatar,
  AvatarStack,
  Badge,
  Button,
  Card,
  LiveDot,
  Mono,
  Spotlight,
} from '#/components/ui'
import { getHomeSummary } from '#/lib/queries'
import { formatClock, formatCount } from '#/lib/format'

export const Route = createFileRoute('/_app/')({
  loader: () => getHomeSummary(),
  component: Home,
})

const SUGGESTIONS = [
  'Find my next talk',
  'What did I miss?',
  'Find people on AI',
  'Where is Hall B?',
]

function Home() {
  const { counts, nextSession, peopleToMeet, trendingProject } =
    Route.useLoaderData()

  return (
    <div className="flex flex-col gap-7">
      {/* ── Command bar ───────────────────────────────────────────── */}
      <Card surface="white" className="p-7 shadow-card-lg sm:p-9">
        <Mono
          tone="ghost"
          className="mb-3.5 block text-center !text-[11.5px] !tracking-[0.14em]"
        >
          Good morning, Sam
        </Mono>
        <h1 className="mx-auto mb-6 max-w-xl text-balance text-center text-[30px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[34px]">
          What do you want to do right now?
        </h1>

        <div className="mx-auto flex max-w-2xl items-center gap-3.5 rounded-[20px] bg-pillow px-[18px] py-[17px] [box-shadow:inset_2px_3px_7px_rgba(40,50,110,.1),inset_-2px_-2px_6px_rgba(255,255,255,.95)]">
          <span className="text-[19px] text-[#7b809a]">⌕</span>
          <span className="flex-1 text-[16px] text-slate">
            Find people working on AI
            <span className="animate-caret ml-0.5 inline-block h-[18px] w-0.5 translate-y-[3px] bg-lime align-baseline" />
          </span>
          <span className="hidden items-center gap-1 font-mono text-[12px] text-muted sm:flex">
            <kbd className="rounded-md bg-white px-1.5 py-1 shadow-soft">⌘</kbd>
            <kbd className="rounded-md bg-white px-2 py-1 shadow-soft">✎</kbd>
          </span>
        </div>

        <div className="mx-auto mt-4 flex max-w-2xl flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              className="rounded-full border border-[rgba(120,130,180,.16)] bg-white px-3.5 py-2 text-[13px] font-medium text-ink-2 shadow-soft transition-transform hover:scale-[0.98]"
            >
              {s}
            </button>
          ))}
        </div>
      </Card>

      {/* ── Right now ─────────────────────────────────────────────── */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Mono className="!text-[13px] !tracking-[0.1em]">Right now</Mono>
          <LiveDot />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          {/* next session */}
          {nextSession ? (
            <Spotlight className="flex flex-col p-6">
              <div className="mb-3.5 flex items-center justify-between">
                <Mono tone="lime" className="!tracking-[0.08em] !text-[11.5px]">
                  Next · {formatClock(nextSession.startsAt)}
                </Mono>
                {nextSession.track && (
                  <Badge tone="ghost">{nextSession.track}</Badge>
                )}
              </div>
              <div className="mb-3.5 text-[22px] font-semibold leading-[1.15] tracking-[-0.02em]">
                {nextSession.title}
              </div>
              {nextSession.speakerName && (
                <div className="mb-5 flex items-center gap-2.5">
                  <Avatar
                    name={nextSession.speakerName}
                    size={28}
                    bg="#3a3f5c"
                    ink="#fff"
                  />
                  <span className="text-[13.5px] text-[#d6d8e6]">
                    {nextSession.speakerName}
                    {nextSession.roomName ? ` · ${nextSession.roomName}` : ''}
                  </span>
                </div>
              )}
              <div className="mt-auto flex gap-2.5">
                <Button variant="lime" className="flex-1">
                  Save my seat
                </Button>
                <Button variant="glass">◎ 4 min walk</Button>
              </div>
            </Spotlight>
          ) : (
            <Card surface="white" className="grid place-items-center p-8 text-mist">
              No sessions scheduled yet.
            </Card>
          )}

          {/* right column */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Card surface="white" className="flex flex-col p-4">
              <div className="mb-3 text-[12.5px] text-muted">People to meet</div>
              <AvatarStack
                size={36}
                people={peopleToMeet.map((p) => ({ name: p.name }))}
              />
              <div className="mt-3 text-[13px] font-medium leading-[1.3]">
                {peopleToMeet.length} here share your intent ·{' '}
                <span className="text-slate">co-founders</span>
              </div>
            </Card>

            {trendingProject && (
              <Link
                to="/projects/$slug"
                params={{ slug: trendingProject.slug }}
                className="flex flex-col rounded-2xl bg-white p-4 shadow-card transition-transform hover:-translate-y-0.5"
              >
                <div className="mb-2.5 text-[12.5px] text-muted">
                  Trending project
                </div>
                <div className="text-[16px] font-semibold tracking-[-0.01em]">
                  {trendingProject.name}
                </div>
                <div className="mt-1 line-clamp-2 flex-1 text-[12.5px] leading-[1.35] text-mist">
                  {trendingProject.tagline}
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 font-mono text-[12px] text-muted">
                  <span className="text-slate">★</span>{' '}
                  {formatCount(trendingProject.trendingScore)} watching
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Counts ────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'People', value: counts.people, to: '/people' as const },
          { label: 'Projects', value: counts.projects, to: '/projects' as const },
          { label: 'Sessions', value: counts.sessions, to: '/sessions' as const },
        ].map((stat) => (
          <Link
            key={stat.label}
            to={stat.to}
            className="rounded-2xl bg-white p-5 shadow-card transition-transform hover:-translate-y-0.5"
          >
            <div className="text-[12.5px] text-muted">{stat.label}</div>
            <div className="mt-2 text-3xl font-semibold tabular-nums">
              {stat.value}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

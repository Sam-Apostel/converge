import { useEffect, useRef, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useChat, fetchServerSentEvents } from '@tanstack/ai-react'

import {
  Avatar,
  AvatarStack,
  Badge,
  Button,
  Card,
  GlassCard,
  LiveDot,
  Mono,
  Spotlight,
} from '#/components/ui'
import { getHomeSummary } from '#/lib/queries'
import { getConciergeStatus } from '#/lib/concierge/settings'
import { ConciergeMessage } from '#/components/concierge/message'
import { formatClock, formatCount } from '#/lib/format'

export const Route = createFileRoute('/_app/')({
  loader: async () => {
    const [summary, conciergeStatus] = await Promise.all([
      getHomeSummary(),
      getConciergeStatus(),
    ])
    return { ...summary, conciergeStatus }
  },
  component: Home,
})

const SUGGESTIONS = [
  'Find my next talk',
  'What did I miss?',
  'Find people into AI',
  'Who should I meet?',
  'Show trending projects',
  "What's on right now?",
]

function Home() {
  const { counts, nextSession, peopleToMeet, trendingProject, conciergeStatus } =
    Route.useLoaderData()

  const { messages, sendMessage, isLoading, error, stop } = useChat({
    connection: fetchServerSentEvents('/api/concierge'),
  })

  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, isLoading])

  const empty = messages.length === 0

  const submit = () => {
    const text = input.trim()
    if (!text || isLoading) return
    sendMessage(text)
    setInput('')
  }

  return (
    <div className="flex flex-col gap-7">
      {/* ── Command bar / Concierge ───────────────────────────────── */}
      <div className="flex flex-col items-center gap-4 pb-2 pt-8 sm:pt-12">
        <Mono
          tone="ghost"
          className="block text-center !text-[11.5px] !tracking-[0.14em]"
        >
          Your AI guide to the conference. Ask anything.
        </Mono>

        {empty ? (
          <h1 className="mx-auto max-w-xl text-balance text-center text-[30px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[38px]">
            What do you want to do right now?
          </h1>
        ) : (
          <div
            ref={scrollRef}
            className="w-full max-w-2xl max-h-[420px] overflow-y-auto"
            style={{ scrollbarWidth: 'thin' }}
          >
            <div className="flex flex-col gap-3 pb-1">
              {messages.map((m) => (
                <ConciergeMessage key={m.id} message={m} />
              ))}
              {isLoading && (
                <div className="flex items-center gap-1.5 px-1">
                  <LiveDot size={6} />
                  <Mono tone="faint">thinking…</Mono>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="w-full max-w-2xl rounded-xl border border-line bg-white/60 px-3.5 py-2.5 text-[12.5px] text-slate">
            Something went wrong: {error.message}.{' '}
            <Link to="/settings" className="font-medium text-ink underline">
              Check your model settings
            </Link>
            .
          </div>
        )}

        {/* glass frame → white inner input */}
        <div className="w-full max-w-2xl rounded-[26px] border border-white/60 bg-white/32 p-2 [backdrop-filter:blur(22px)_saturate(1.7)] [box-shadow:0_1px_3px_rgba(40,50,110,.05),0_16px_40px_rgba(40,50,110,.12)]">
          <div className="flex items-center gap-3.5 rounded-[18px] bg-white px-[18px] py-[11px] shadow-[0_1px_2px_rgba(40,50,110,.05)]">
            <span className="text-[18px] text-[#7b809a]">⌕</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  submit()
                }
              }}
              placeholder={empty ? 'Find people working on AI' : 'Ask anything…'}
              className="flex-1 bg-transparent text-[16px] text-slate outline-none placeholder:text-slate/60"
            />
            {isLoading ? (
              <button
                type="button"
                onClick={stop}
                aria-label="Stop"
                className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] bg-pillow text-slate transition-transform active:scale-95"
              >
                <span className="size-3 rounded-[3px] bg-ink" />
              </button>
            ) : (
              <>
                {input.trim() && (
                  <span className="hidden items-center gap-1 font-mono text-[12px] text-muted sm:flex">
                    <kbd className="rounded-[7px] bg-pillow px-[7px] py-[3px]">⌘</kbd>
                    <kbd className="rounded-[7px] bg-pillow px-2 py-[3px]">↵</kbd>
                  </span>
                )}
                <button
                  type="button"
                  onClick={submit}
                  disabled={!input.trim()}
                  aria-label="Send"
                  className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] bg-ink text-[17px] text-lime transition-transform active:scale-95 disabled:opacity-40"
                >
                  ↑
                </button>
              </>
            )}
          </div>
        </div>

        {/* suggestion chips — only in empty state when concierge is ready */}
        {empty && conciergeStatus.ready && (
          <div className="flex w-fit flex-wrap justify-center gap-2 rounded-[40px] border border-white/60 bg-white/34 px-2 py-2 [backdrop-filter:blur(18px)_saturate(1.5)] [box-shadow:inset_0_1px_0_rgba(255,255,255,.6)]">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => sendMessage(s)}
                className="rounded-full border border-[rgba(120,130,180,.18)] bg-white px-[15px] py-2 text-[13.5px] font-medium text-[#2a2e48] shadow-soft transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-px hover:border-[rgba(120,130,180,.4)] hover:[box-shadow:0_4px_12px_rgba(40,50,110,.14)] active:scale-[0.97]"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* no model configured — nudge to settings */}
        {empty && !conciergeStatus.ready && (
          <div className="w-full max-w-2xl rounded-2xl border border-line bg-white/70 px-5 py-4 text-[13.5px] text-slate [backdrop-filter:blur(12px)]">
            Configure your AI provider in{' '}
            <Link to="/settings" className="font-medium text-ink underline">
              Settings
            </Link>{' '}
            to start chatting. You can use a local Ollama server or bring your
            own Anthropic / OpenAI key.
          </div>
        )}
      </div>

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
            <GlassCard innerClassName="flex flex-col p-[17px_20px]">
              <div className="mb-3 text-[12.5px] text-muted">People to meet</div>
              <AvatarStack
                size={36}
                people={peopleToMeet.map((p) => ({ name: p.name }))}
              />
              <div className="mt-3 text-[13px] font-medium leading-[1.3]">
                {peopleToMeet.length} here share your intent ·{' '}
                <span className="text-slate">co-founders</span>
              </div>
            </GlassCard>

            {trendingProject && (
              <GlassCard>
                <Link
                  to="/projects/$slug"
                  params={{ slug: trendingProject.slug }}
                  className="flex flex-col rounded-[18px] p-[17px_20px] transition-opacity hover:opacity-80"
                >
                  <div className="mb-2 text-[12.5px] text-muted">
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
              </GlassCard>
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

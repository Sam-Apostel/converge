import { useEffect, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { useChat, fetchServerSentEvents } from '@tanstack/ai-react'

import { LiveDot, Mono } from '#/components/ui'
import type { ConciergeStatus } from '#/lib/concierge/settings'

import { Composer } from './composer'
import { ConciergeMessage } from './message'

const PROMPTS = [
  "What's on right now?",
  'What did I miss?',
  'Find people into AI',
  'Show me my schedule',
  'What projects use React?',
]

/**
 * The §1, Direction C "glass concierge" (silo 7): frosted outer frame, opaque
 * `#f6f7fc` inner, streamed messages with inline tool results, and a lime input
 * dock. Streams from `/api/concierge` via TanStack AI's `useChat`.
 */
export function ConciergeChat({
  status,
  greetingName,
}: {
  status: ConciergeStatus
  greetingName?: string
}) {
  const { messages, sendMessage, isLoading, error, stop } = useChat({
    connection: fetchServerSentEvents('/api/concierge'),
  })

  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, isLoading])

  const empty = messages.length === 0
  const modelLabel = `${status.providerLabel} · ${status.model}`

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-[30px] p-5 sm:p-6"
      style={{
        minHeight: '70vh',
        background:
          'linear-gradient(160deg,#cfd6f4 0%,#d9d3f2 50%,#e7eaf8 100%)',
      }}
    >
      {/* lime + violet glow blobs */}
      <div
        className="pointer-events-none absolute -left-16 top-12 size-72 rounded-full blur-lg"
        style={{
          background:
            'radial-gradient(circle,rgba(153,255,0,.45),transparent 68%)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 -right-12 size-60 rounded-full blur-md"
        style={{
          background:
            'radial-gradient(circle,rgba(168,140,255,.5),transparent 66%)',
        }}
        aria-hidden
      />

      {/* glass frame */}
      <div className="relative flex flex-1 flex-col rounded-[26px] border border-white/60 bg-white/30 p-4 [backdrop-filter:blur(26px)_saturate(1.6)] [box-shadow:0_18px_50px_rgba(40,50,110,.18),inset_0_1px_0_rgba(255,255,255,.7)]">
        {/* opaque neumorphic inner */}
        <div className="flex flex-1 flex-col rounded-[20px] bg-inner p-4 sm:p-5 [box-shadow:0_2px_6px_rgba(40,50,110,.07),inset_0_1px_0_rgba(255,255,255,.9)]">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-[13px] font-medium text-slate">
              <span className="text-[15px] text-slate">✦</span> Converge
              concierge
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1 font-mono text-[11px] text-slate">
              <LiveDot size={6} /> {modelLabel}
            </span>
          </div>

          {/* messages / empty state */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto"
            style={{ scrollbarWidth: 'thin' }}
          >
            {empty ? (
              <div className="flex h-full flex-col justify-center">
                <h2 className="mb-4 text-[25px] font-semibold leading-[1.12] tracking-[-0.03em] text-ink-2">
                  What do you want to
                  <br />
                  do right now{greetingName ? `, ${greetingName}` : ''}?
                </h2>
                <div className="flex flex-wrap gap-2">
                  {PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => sendMessage(p)}
                      className="rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink shadow-soft transition-transform hover:scale-[0.98]"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pb-1">
                {messages.map((m) => (
                  <ConciergeMessage key={m.id} message={m} />
                ))}
                {isLoading ? (
                  <div className="flex items-center gap-1.5 px-1">
                    <LiveDot size={6} />
                    <Mono tone="faint">thinking…</Mono>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {!status.ready ? (
            <div className="mt-3 rounded-xl border border-line bg-white/70 px-3.5 py-2.5 text-[12.5px] text-slate">
              No model is reachable right now. Start a local Ollama server, or{' '}
              <Link to="/settings" className="font-medium text-ink underline">
                configure a provider in Settings
              </Link>
              .
            </div>
          ) : null}

          {error ? (
            <div className="mt-3 rounded-xl border border-line bg-white/70 px-3.5 py-2.5 text-[12.5px] text-slate">
              Something went wrong: {error.message}.{' '}
              <Link to="/settings" className="font-medium text-ink underline">
                Check your model settings
              </Link>
              .
            </div>
          ) : null}

          <Composer
            onSend={(t) => sendMessage(t)}
            isLoading={isLoading}
            onStop={stop}
          />
        </div>
      </div>
    </div>
  )
}

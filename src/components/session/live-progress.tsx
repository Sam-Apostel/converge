import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ProgressBar } from '@progress/kendo-react-progressbars'

import { Mono } from '#/components/ui'
import { formatClock } from '#/lib/format'

/** Every session reserves its final stretch for live Q&A. */
const QA_MS = 5 * 60_000

/**
 * Top bar (breadcrumb + room) and the live progress track: a dark "Talk"
 * segment, a striped "Q&A" segment, and a pulsing lime playhead. Progress is
 * the talk's real wall-clock position between `startsAt` and `endsAt`, so the
 * playhead crosses into the Q&A region for the closing five minutes — and the
 * Talk/Q&A split on the track matches the times printed beneath it.
 */
export function LiveProgress({
  title,
  roomName,
  startsAt,
  endsAt,
}: {
  title: string
  roomName: string | null
  startsAt: string | Date | null
  endsAt: string | Date | null
}) {
  const startMs = startsAt != null ? new Date(startsAt).getTime() : null
  const endMs = endsAt != null ? new Date(endsAt).getTime() : null

  // Tick once a second off the wall clock. Seed `now` from the start time so the
  // server render and first client paint agree (no hydration mismatch); the
  // effect swaps in the real time on mount.
  const [now, setNow] = useState(() => startMs ?? 0)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const total = startMs != null && endMs != null ? endMs - startMs : 0
  // Whole-session progress (0–1); the playhead rides this across the full track.
  const sessionFraction =
    total > 0 && startMs != null
      ? Math.max(0, Math.min(1, (now - startMs) / total))
      : 0
  // The talk owns everything up to the final Q&A window; the striped rest is Q&A.
  const talkRatio = total > 0 ? Math.max(0, (total - QA_MS) / total) : 0.8
  // Progress through the talk alone — reaches 1 exactly when Q&A begins.
  const talkProgress =
    talkRatio > 0 ? Math.min(1, sessionFraction / talkRatio) : 1

  const dotLeft = `${sessionFraction * 100}%`
  const qaStart = endMs != null ? formatClock(new Date(endMs - QA_MS)) : '--:--'

  return (
    <div className="border-b border-edge/12 px-6 pb-[17px] pt-[15px]">
      <div className="mb-[13px] flex items-center gap-3">
        <Link to="/sessions">
          <Mono
            tone="ghost"
            className="text-caption normal-case tracking-normal"
          >
            Sessions
          </Mono>
        </Link>
        <span className="text-frost">/</span>
        <span className="truncate font-mono text-caption text-ink">
          {title}
        </span>
        {roomName ? (
          <Mono
            tone="ghost"
            className="ml-auto shrink-0 text-caption normal-case tracking-normal"
          >
            {roomName}
          </Mono>
        ) : null}
      </div>

      <div className="flex items-center gap-[11px]">
        <Mono
          tone="ghost"
          className="w-9 text-tiny normal-case tracking-normal"
        >
          {formatClock(startsAt)}
        </Mono>
        <div className="relative h-2.5 flex-1">
          <div className="absolute inset-0 flex gap-[3px]">
            <ProgressBar
              value={talkProgress * 100}
              labelVisible={false}
              className="converge-live-bar"
              style={{ flexGrow: talkRatio }}
            />
            <div
              className="rounded-full [background:repeating-linear-gradient(90deg,#e7eaf4_0_5px,#dde1ee_5px_10px)]"
              style={{ flexGrow: 1 - talkRatio }}
            />
          </div>
          <div
            className="animate-live-pulse absolute top-1/2 h-[15px] w-[15px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-white bg-lime transition-[left] duration-500 ease-out [box-shadow:0_1px_5px_rgba(60,90,0,.45)]"
            style={{ left: dotLeft }}
          />
        </div>
        <Mono
          tone="ghost"
          className="w-9 text-right text-tiny normal-case tracking-normal"
        >
          {formatClock(endsAt)}
        </Mono>
      </div>

      <div className="mt-2 flex gap-4 pl-[47px]">
        <span className="flex items-center gap-1.5 text-tiny font-medium text-slate">
          <span className="h-2 w-2 rounded-[3px] bg-ink" />
          Talk · live now
        </span>
        <span className="flex items-center gap-1.5 text-tiny font-medium text-faint">
          <span className="h-2 w-2 rounded-[3px] [background:repeating-linear-gradient(90deg,#cfd4e4_0_3px,#e7eaf4_3px_6px)]" />
          Q&amp;A · {qaStart}–{formatClock(endsAt)}
        </span>
      </div>
    </div>
  )
}

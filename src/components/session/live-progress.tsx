import { Link } from '@tanstack/react-router'

import { Mono } from '#/components/ui'
import { formatClock } from '#/lib/format'

/**
 * Top bar (breadcrumb + room) and the live progress track: a dark "Talk"
 * segment, a striped "Q&A" segment, and a pulsing lime playhead driven by
 * `fraction` (0–1 through the talk).
 */
export function LiveProgress({
  title,
  roomName,
  startsAt,
  endsAt,
  fraction,
}: {
  title: string
  roomName: string | null
  startsAt: string | Date | null
  endsAt: string | Date | null
  fraction: number
}) {
  const clamped = Math.max(0, Math.min(1, fraction))
  // The talk owns 80% of the track (flex 8 of 10); Q&A the striped rest.
  const dotLeft = `${clamped * 80}%`
  const fillWidth = `${clamped * 100}%`

  const qaStart =
    endsAt != null
      ? formatClock(new Date(new Date(endsAt).getTime() - 5 * 60_000))
      : '--:--'

  return (
    <div className="border-b border-[rgba(120,130,180,.12)] px-6 pb-[17px] pt-[15px]">
      <div className="mb-[13px] flex items-center gap-3">
        <Link to="/sessions">
          <Mono
            tone="ghost"
            className="text-[12.5px] normal-case tracking-normal"
          >
            Sessions
          </Mono>
        </Link>
        <span className="text-[#c2c6d8]">/</span>
        <span className="truncate font-mono text-[12.5px] text-ink">
          {title}
        </span>
        {roomName ? (
          <Mono
            tone="ghost"
            className="ml-auto shrink-0 text-[12px] normal-case tracking-normal"
          >
            {roomName}
          </Mono>
        ) : null}
      </div>

      <div className="flex items-center gap-[11px]">
        <Mono
          tone="ghost"
          className="w-9 text-[11px] normal-case tracking-normal"
        >
          {formatClock(startsAt)}
        </Mono>
        <div className="relative h-2.5 flex-1">
          <div className="absolute inset-0 flex gap-[3px]">
            <div className="relative flex-[8] overflow-hidden rounded-full bg-[#e7eaf4]">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-ink transition-[width] duration-500 ease-out"
                style={{ width: fillWidth }}
              />
            </div>
            <div className="flex-[2] rounded-full [background:repeating-linear-gradient(90deg,#e7eaf4_0_5px,#dde1ee_5px_10px)]" />
          </div>
          <div
            className="animate-live-pulse absolute top-1/2 h-[15px] w-[15px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-white bg-lime transition-[left] duration-500 ease-out [box-shadow:0_1px_5px_rgba(60,90,0,.45)]"
            style={{ left: dotLeft }}
          />
        </div>
        <Mono
          tone="ghost"
          className="w-9 text-right text-[11px] normal-case tracking-normal"
        >
          {formatClock(endsAt)}
        </Mono>
      </div>

      <div className="mt-2 flex gap-4 pl-[47px]">
        <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-slate">
          <span className="h-2 w-2 rounded-[3px] bg-ink" />
          Talk · live now
        </span>
        <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-faint">
          <span className="h-2 w-2 rounded-[3px] [background:repeating-linear-gradient(90deg,#cfd4e4_0_3px,#e7eaf4_3px_6px)]" />
          Q&amp;A · {qaStart}–{formatClock(endsAt)}
        </span>
      </div>
    </div>
  )
}

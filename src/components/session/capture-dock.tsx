import { Star } from 'lucide-react'

import { BorderBeam, Button, LiveDot, Mono } from '#/components/ui'

/**
 * The dark "capture dock" beneath the live slide / player (design update): a
 * #13141d container with a lime radial glow holding a pulsing CAPTURE label, a
 * short line, and the lime bookmark button. The button stays wired to whatever
 * owns the capture (the player needs its ref to read the live timecode).
 */
export function CaptureDock({
  time = 'LIVE',
  label,
  buttonLabel,
  onCapture,
}: {
  time?: string
  label: string
  buttonLabel: string
  onCapture: () => void
}) {
  return (
    <div className="relative mt-3.5 flex items-center gap-4 overflow-hidden rounded-[18px] bg-ink px-[18px] py-4 text-white">
      <BorderBeam speed={4} />
      <div className="pointer-events-none absolute -bottom-[54px] -right-10 h-[180px] w-[180px] rounded-full [background:radial-gradient(circle,rgba(153,255,0,.22),transparent_70%)]" />
      <div className="relative min-w-0 flex-1">
        <div className="mb-1.5 flex items-center gap-2">
          <LiveDot size={7} />
          <Mono tone="lime" className="!text-[11px] !tracking-[0.1em]">
            Capture · {time}
          </Mono>
        </div>
        <div className="text-[16px] font-semibold tracking-[-0.01em]">
          {label}
        </div>
      </div>
      <Button
        variant="lime"
        onClick={onCapture}
        className="relative shrink-0 !rounded-[14px] !px-[22px] !py-3.5 !text-[15px]"
      >
        <Star size={17} className="fill-current" /> {buttonLabel}
      </Button>
    </div>
  )
}

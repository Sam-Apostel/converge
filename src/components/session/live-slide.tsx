import { Thumb } from '#/components/ui'

import { CaptureDock } from './capture-dock'
import { SLIDE_MS, formatOffset } from './slides'
import type { Slide } from './slides'

/**
 * The live slide on stage right now + the capture dock beneath it. Tapping the
 * lime button in the dock bookmarks this slide into the moments rail.
 */
export function LiveSlide({
  slide,
  total,
  onBookmark,
}: {
  slide: Slide
  total: number
  onBookmark: () => void
}) {
  return (
    <div>
      <Thumb
        tint="#eef0f8"
        height={230}
        radius={18}
        className="[box-shadow:inset_0_0_0_1px_rgba(120,130,180,.12)]"
      >
        <div className="absolute left-3.5 top-3.5 rounded-lg bg-white/90 px-[11px] py-1.5 font-mono text-[11px] text-[#5b6080] backdrop-blur-sm">
          Slide {slide.n} — {slide.topic}
        </div>
        <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5 rounded-[7px] bg-white/90 px-2.5 py-[5px] font-mono text-[11px] text-slate">
          <span className="animate-live-pulse h-1.5 w-1.5 rounded-full bg-lime" />
          on stage now
        </div>
        <span className="absolute bottom-3.5 left-3.5 rounded-[9px] bg-white/[.92] px-3 py-[7px] font-mono text-[12px] text-[#5b6080] shadow-soft">
          {total} slides · #{slide.n} live
        </span>
      </Thumb>

      <CaptureDock
        time={formatOffset(slide.n * SLIDE_MS)}
        label="Keep this slide on your timeline"
        buttonLabel="Bookmark this slide"
        onCapture={onBookmark}
      />
    </div>
  )
}

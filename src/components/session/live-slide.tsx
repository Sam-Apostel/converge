import { Button, Thumb } from '#/components/ui'

import type { Slide } from './slides'

/**
 * The live slide on stage right now + the one-tap capture. Tapping the lime
 * button bookmarks this slide into the moments rail.
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
    <Thumb
      tint="#eef0f8"
      height={248}
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
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4">
        <span className="rounded-[9px] bg-white/[.92] px-3 py-[7px] font-mono text-[12px] text-[#5b6080] shadow-soft">
          {total} slides · #{slide.n} live
        </span>
        <Button variant="lime" onClick={onBookmark} className="text-[14.5px]">
          <span className="text-base leading-none">★</span> Bookmark this slide
        </Button>
      </div>
    </Thumb>
  )
}

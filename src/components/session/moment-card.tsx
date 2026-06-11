import { Thumb } from '#/components/ui'

/** One bookmarked slide in the moments rail — a thumbnail with its timestamp,
 * slide ref and topic, plus a remove ×. Animates in when freshly captured. */
export function MomentCard({
  time,
  slideRef,
  topic,
  onRemove,
}: {
  time: string
  slideRef: string | null
  topic: string
  onRemove: () => void
}) {
  return (
    <div className="animate-moment-in overflow-hidden rounded-[14px] bg-white [box-shadow:0_1px_3px_rgba(40,50,110,.07),0_8px_18px_rgba(40,50,110,.06)]">
      <Thumb tint="#eef0f8" height={84} radius={0}>
        <span className="absolute left-[7px] top-[7px] rounded-md bg-lime/70 px-[7px] py-0.5 font-mono text-[10px] font-semibold text-[#21261a]">
          ★ {time}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove moment"
          className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-md bg-white/[.92] text-[13px] leading-none text-faint transition-colors hover:text-[#ff4d3d]"
        >
          ×
        </button>
        {slideRef ? (
          <span className="absolute bottom-[7px] left-[7px] rounded-md bg-white/[.86] px-[7px] py-0.5 font-mono text-[10px] text-[#5b6080]">
            {slideRef}
          </span>
        ) : null}
      </Thumb>
      <div className="px-2.5 pb-[11px] pt-[9px]">
        <div className="text-[12.5px] font-semibold leading-[1.25] tracking-[-0.01em]">
          {topic}
        </div>
      </div>
    </div>
  )
}

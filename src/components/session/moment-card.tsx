import type { MouseEvent, ReactNode } from 'react'

import { Thumb } from '#/components/ui'

/**
 * One bookmarked moment in the rail — a thumbnail with its timestamp, slide ref
 * and topic, plus a remove ×. When it carries a livestream frame it shows the
 * stream poster and links back to that exact second. Animates in on capture.
 */
export function MomentCard({
  time,
  slideRef,
  topic,
  thumbnailUrl,
  href,
  onRemove,
}: {
  time: string
  slideRef: string | null
  topic: string
  thumbnailUrl?: string | null
  href?: string | null
  onRemove: () => void
}) {
  function remove(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    onRemove()
  }

  const visual = (
    <div className="relative h-[84px]">
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <Thumb
          tint="#eef0f8"
          height={84}
          radius={0}
          className="absolute inset-0"
        />
      )}
      <span className="absolute left-[7px] top-[7px] rounded-md bg-lime/70 px-[7px] py-0.5 font-mono text-[10px] font-semibold text-[#21261a]">
        ★ {time}
      </span>
      <button
        type="button"
        onClick={remove}
        aria-label="Remove moment"
        className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-md bg-white/[.92] text-[13px] leading-none text-faint transition-colors hover:text-[#ff4d3d]"
      >
        ×
      </button>
      {href ? (
        <span className="absolute bottom-[7px] left-[7px] rounded-md bg-white/[.86] px-[7px] py-0.5 font-mono text-[10px] text-[#5b6080]">
          ▶ Jump
        </span>
      ) : slideRef ? (
        <span className="absolute bottom-[7px] left-[7px] rounded-md bg-white/[.86] px-[7px] py-0.5 font-mono text-[10px] text-[#5b6080]">
          {slideRef}
        </span>
      ) : null}
    </div>
  )

  const body = (
    <div className="px-2.5 pb-[11px] pt-[9px]">
      <div className="text-[12.5px] font-semibold leading-[1.25] tracking-[-0.01em]">
        {topic}
      </div>
    </div>
  )

  const shell = (children: ReactNode) =>
    href ? (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="animate-moment-in block overflow-hidden rounded-[14px] bg-white transition-transform duration-150 hover:-translate-y-px [box-shadow:0_1px_3px_rgba(40,50,110,.07),0_8px_18px_rgba(40,50,110,.06)]"
      >
        {children}
      </a>
    ) : (
      <div className="animate-moment-in overflow-hidden rounded-[14px] bg-white [box-shadow:0_1px_3px_rgba(40,50,110,.07),0_8px_18px_rgba(40,50,110,.06)]">
        {children}
      </div>
    )

  return shell(
    <>
      {visual}
      {body}
    </>,
  )
}

import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { Play, Plus, Star, X } from 'lucide-react'

import { Avatar, Thumb } from '#/components/ui'
import type { SharedMomentPerson } from '#/routes/api/moments/shared'

/**
 * One bookmarked moment in the rail — a thumbnail with its timestamp, slide ref
 * and topic, plus a remove ×. When it carries a livestream frame it shows the
 * stream poster and a "Jump" link back to that exact second.
 *
 * Tapping the body expands an inline note editor (saved on blur or via Save),
 * and beneath the card we surface the other attendees who kept the same passage
 * — the social layer that turns a private bookmark into a shared moment.
 */
export function MomentCard({
  sessionId,
  timestampMs,
  time,
  slideRef,
  topic,
  note,
  thumbnailUrl,
  href,
  onRemove,
  onSaveNote,
}: {
  sessionId: string
  timestampMs: number
  time: string
  slideRef: string | null
  topic: string
  note: string | null
  thumbnailUrl?: string | null
  href?: string | null
  onRemove: () => void
  onSaveNote: (note: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState(note ?? '')
  const [shared, setShared] = useState<Array<SharedMomentPerson>>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Keep the editor in sync if the note changes underneath us (e.g. refetch).
  useEffect(() => setDraft(note ?? ''), [note])

  // Focus the textarea when the editor opens.
  useEffect(() => {
    if (expanded) textareaRef.current?.focus()
  }, [expanded])

  // Who else kept this same passage? (±30s window, others only.)
  useEffect(() => {
    let active = true
    fetch(
      `/api/moments/shared?sessionId=${encodeURIComponent(
        sessionId,
      )}&timestampMs=${timestampMs}`,
    )
      .then((r) => (r.ok ? (r.json() as Promise<Array<SharedMomentPerson>>) : []))
      .then((people) => {
        if (active) setShared(people)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [sessionId, timestampMs])

  function remove(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    onRemove()
  }

  function commit() {
    const next = draft.trim()
    if (next !== (note ?? '')) onSaveNote(next)
  }

  const preview =
    note && note.length > 50 ? `${note.slice(0, 50).trimEnd()}…` : note

  const shownShared = shared.slice(0, 3)
  const overflow = shared.length - shownShared.length

  return (
    <div>
      <div className="animate-moment-in overflow-hidden rounded-[14px] bg-white [box-shadow:0_1px_3px_rgba(40,50,110,.07),0_8px_18px_rgba(40,50,110,.06)]">
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
          <span className="absolute left-[7px] top-[7px] inline-flex items-center gap-1 rounded-md bg-lime/70 px-[7px] py-0.5 font-mono text-[10px] font-semibold text-[#21261a]">
            <Star size={11} className="fill-current" /> {time}
          </span>
          <button
            type="button"
            onClick={remove}
            aria-label="Remove moment"
            className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-md bg-white/[.92] leading-none text-faint transition-colors hover:text-[#ff4d3d]"
          >
            <X size={13} strokeWidth={2.5} />
          </button>
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-[7px] left-[7px] inline-flex items-center gap-1 rounded-md bg-white/[.86] px-[7px] py-0.5 font-mono text-[10px] text-[#5b6080] transition-colors hover:bg-white"
            >
              <Play size={10} className="fill-current" /> Jump
            </a>
          ) : slideRef ? (
            <span className="absolute bottom-[7px] left-[7px] rounded-md bg-white/[.86] px-[7px] py-0.5 font-mono text-[10px] text-[#5b6080]">
              {slideRef}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="block w-full px-2.5 pb-[11px] pt-[9px] text-left"
        >
          <div className="text-[12.5px] font-semibold leading-[1.25] tracking-[-0.01em]">
            {topic}
          </div>
          {!expanded &&
            (preview ? (
              <div className="mt-1 line-clamp-2 text-[11.5px] leading-[1.35] text-[#6b7090]">
                {preview}
              </div>
            ) : (
              <div className="mt-1 inline-flex items-center gap-1 text-[11.5px] text-faint">
                <Plus size={11} /> Add a thought…
              </div>
            ))}
        </button>

        {expanded && (
          <div className="px-2.5 pb-2.5">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              placeholder="Add a thought…"
              rows={3}
              className="w-full resize-none rounded-[10px] bg-inner px-2.5 py-2 text-[12px] leading-[1.4] text-ink outline-none ring-1 ring-inset ring-[rgba(120,130,180,.18)] transition-shadow placeholder:text-faint focus:ring-[rgba(120,130,180,.45)]"
            />
            <div className="mt-1.5 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  commit()
                  setExpanded(false)
                }}
                className="rounded-[9px] bg-ink px-3 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-ink-2"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      {shownShared.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5 pl-0.5">
          <div className="flex items-center">
            {shownShared.map((p, i) => (
              <Link
                key={p.userId}
                to="/people/$userId"
                params={{ userId: p.userId }}
                title={p.name}
                className="rounded-full transition-transform hover:-translate-y-0.5"
                style={{ marginLeft: i === 0 ? 0 : -8, zIndex: shownShared.length - i }}
              >
                <Avatar name={p.name} src={p.avatarUrl} size={22} border="#fff" />
              </Link>
            ))}
            {overflow > 0 && (
              <span
                className="grid h-[22px] min-w-[22px] place-items-center rounded-full bg-ink px-1 font-mono text-[10px] font-semibold text-white"
                style={{ marginLeft: -8 }}
              >
                +{overflow}
              </span>
            )}
          </div>
          <span className="text-[10.5px] text-faint">also kept this</span>
        </div>
      )}
    </div>
  )
}

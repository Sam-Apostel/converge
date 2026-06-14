import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { Play, Plus, Star, X } from 'lucide-react'

import { Avatar, Thumb } from '#/components/ui'
import { cn } from '#/lib/utils'
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
      .then((r) =>
        r.ok ? (r.json() as Promise<Array<SharedMomentPerson>>) : [],
      )
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
      <div
        className={cn(
          'animate-moment-in overflow-hidden',
          'rounded-[14px] bg-white shadow-card',
        )}
      >
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
          <span
            className={cn(
              'absolute left-[7px] top-[7px] inline-flex items-center gap-1',
              'font-mono text-micro font-semibold text-ink',
              'rounded-md bg-lime/70 px-[7px] py-0.5',
            )}
          >
            <Star size={11} className="fill-current" /> {time}
          </span>
          <button
            type="button"
            onClick={remove}
            aria-label="Remove moment"
            className={cn(
              'absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center',
              'leading-none text-faint',
              'rounded-md bg-white/[.92]',
              'transition-colors hover:text-danger',
            )}
          >
            <X size={13} strokeWidth={2.5} />
          </button>
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className={cn(
                'absolute bottom-[7px] left-[7px] inline-flex items-center gap-1',
                'font-mono text-micro text-slate',
                'rounded-md bg-white/[.86] px-[7px] py-0.5',
                'transition-colors hover:bg-white',
              )}
            >
              <Play size={10} className="fill-current" /> Jump
            </a>
          ) : slideRef ? (
            <span
              className={cn(
                'absolute bottom-[7px] left-[7px]',
                'font-mono text-micro text-slate',
                'rounded-md bg-white/[.86] px-[7px] py-0.5',
              )}
            >
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
          <div className="text-caption font-semibold leading-[1.25] tracking-snug">
            {topic}
          </div>
          {!expanded &&
            (preview ? (
              <div className="mt-1 line-clamp-2 text-tiny leading-[1.35] text-mist">
                {preview}
              </div>
            ) : (
              <div className="mt-1 inline-flex items-center gap-1 text-tiny text-faint">
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
              className={cn(
                'w-full resize-none px-2.5 py-2',
                'text-caption leading-[1.4] text-ink',
                'rounded-[10px] bg-inner outline-none ring-1 ring-inset ring-edge/18',
                'transition-shadow',
                'placeholder:text-faint focus:ring-edge/45',
              )}
            />
            <div className="mt-1.5 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  commit()
                  setExpanded(false)
                }}
                className={cn(
                  'px-3 py-1.5 text-tiny font-semibold text-white',
                  'rounded-[9px] bg-ink',
                  'transition-colors hover:bg-ink-2',
                )}
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
                className={cn(
                  '-ml-2 z-(--stack-index) rounded-full',
                  'transition-transform first:ml-0 hover:-translate-y-0.5',
                )}
                style={
                  { '--stack-index': shownShared.length - i } as CSSProperties
                }
              >
                <Avatar
                  name={p.name}
                  src={p.avatarUrl}
                  size={22}
                  border="#fff"
                />
              </Link>
            ))}
            {overflow > 0 && (
              <span
                className={cn(
                  '-ml-2 grid h-[22px] min-w-[22px] place-items-center px-1',
                  'font-mono text-micro font-semibold text-white',
                  'rounded-full bg-ink',
                )}
              >
                +{overflow}
              </span>
            )}
          </div>
          <span className="text-micro text-faint">also kept this</span>
        </div>
      )}
    </div>
  )
}

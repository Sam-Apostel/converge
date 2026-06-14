import { Link } from '@tanstack/react-router'
import { Star } from 'lucide-react'

import { Avatar, Badge, Mono, Thumb } from '#/components/ui'
import { cn } from '#/lib/utils'

import { MomentCard } from './moment-card'

export type MomentView = {
  id: string
  sessionId: string
  timestampMs: number
  time: string
  slideRef: string | null
  topic: string
  note: string | null
  thumbnailUrl?: string | null
  href?: string | null
}

export type RelatedPerson = {
  id: string
  name: string
  image: string | null
  note: string
}

export type RelatedProject = {
  name: string
  slug: string
  tagline: string | null
  ownerName: string | null
}

/**
 * The right rail: "Your moments" (the slides you kept), then the people and
 * project woven around this talk. The grid is driven by the optimistic moments
 * collection so captures appear instantly.
 */
export function MomentsRail({
  moments,
  ready,
  relatedPeople,
  relatedProject,
  onRemove,
  onSaveNote,
}: {
  moments: Array<MomentView>
  ready: boolean
  relatedPeople: Array<RelatedPerson>
  relatedProject: RelatedProject | null
  onRemove: (id: string) => void
  onSaveNote: (id: string, note: string) => void
}) {
  return (
    <div className="bg-inner px-6 pb-[30px] pt-[26px]">
      <div className="mb-1 flex items-center gap-[9px]">
        <span className="text-base font-semibold tracking-snug">
          Your moments
        </span>
        <Badge tone="lime-soft" mono>
          {moments.length}
        </Badge>
      </div>
      <p className="mb-4 text-caption text-muted">
        The slides you kept — on your timeline forever.
      </p>

      {ready && moments.length === 0 ? (
        <div
          className={cn(
            'px-[18px] py-[26px] text-center',
            'rounded-[18px] border-[1.5px] border-dashed border-edge/30 bg-white/50',
          )}
        >
          <div
            className={cn(
              'mx-auto mb-3 grid h-[46px] w-[46px] place-items-center',
              'rounded-[14px] bg-white text-frost shadow-soft',
            )}
          >
            <Star size={22} />
          </div>
          <div className="mb-1 text-body font-semibold">No moments yet</div>
          <div className="text-note leading-body text-muted">
            Tap{' '}
            <strong className="font-semibold text-slate">
              Bookmark this slide
            </strong>{' '}
            and it lands here with its slide and timestamp.
          </div>
        </div>
      ) : null}

      {moments.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5">
          {moments.map((m) => (
            <MomentCard
              key={m.id}
              sessionId={m.sessionId}
              timestampMs={m.timestampMs}
              time={m.time}
              slideRef={m.slideRef}
              topic={m.topic}
              note={m.note}
              thumbnailUrl={m.thumbnailUrl}
              href={m.href}
              onRemove={() => onRemove(m.id)}
              onSaveNote={(note) => onSaveNote(m.id, note)}
            />
          ))}
        </div>
      ) : null}

      {relatedPeople.length > 0 ? (
        <>
          <div className="mb-[11px] mt-6 text-note font-semibold text-slate">
            In the room for you
          </div>
          <div className="flex flex-col gap-[9px]">
            {relatedPeople.map((p) => (
              <div
                key={p.id}
                className={cn(
                  'flex items-center gap-[11px]',
                  'rounded-[14px] bg-white px-[13px] py-[11px] shadow-soft',
                )}
              >
                <Avatar name={p.name} src={p.image} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="text-note font-semibold">{p.name}</div>
                  <div className="text-tiny text-muted">{p.note}</div>
                </div>
                <Link
                  to="/people/$userId"
                  params={{ userId: p.id }}
                  className={cn(
                    'text-caption font-medium text-slate',
                    'rounded-full bg-pillow px-[11px] py-1.5',
                    'transition-colors hover:bg-pillow-deep',
                  )}
                >
                  View profile
                </Link>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {relatedProject ? (
        <Link
          to="/projects/$slug"
          params={{ slug: relatedProject.slug }}
          className={cn(
            'mt-[18px] block overflow-hidden',
            'rounded-2xl bg-white shadow-card',
          )}
        >
          <Thumb tint="#e2eef0" height={76} radius={0}>
            <span
              className={cn(
                'absolute bottom-2 left-2.5',
                'font-mono text-micro text-[#3f6173]',
                'rounded-md bg-white/[.88] px-2 py-[3px]',
              )}
            >
              {relatedProject.slug} · live demo
            </span>
          </Thumb>
          <div className="px-3.5 py-[13px]">
            <Mono tone="ghost" className="mb-[5px] block text-tiny">
              Related project
            </Mono>
            <div className="text-body font-semibold tracking-snug">
              {relatedProject.name}
            </div>
            {relatedProject.tagline ? (
              <div className="mt-[3px] text-caption leading-[1.4] text-mist">
                {relatedProject.tagline.replace(/\.$/, '')}
                {relatedProject.ownerName
                  ? `. by ${relatedProject.ownerName}.`
                  : '.'}
              </div>
            ) : null}
          </div>
        </Link>
      ) : null}
    </div>
  )
}

import { Link } from '@tanstack/react-router'

import { Avatar, Badge, Mono, Thumb } from '#/components/ui'

import { MomentCard } from './moment-card'

export type MomentView = {
  id: string
  time: string
  slideRef: string | null
  topic: string
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
}: {
  moments: Array<MomentView>
  ready: boolean
  relatedPeople: Array<RelatedPerson>
  relatedProject: RelatedProject | null
  onRemove: (id: string) => void
}) {
  return (
    <div className="bg-inner px-6 pb-[30px] pt-[26px]">
      <div className="mb-1 flex items-center gap-[9px]">
        <span className="text-base font-semibold tracking-[-0.01em]">
          Your moments
        </span>
        <Badge tone="lime-soft" mono>
          {moments.length}
        </Badge>
      </div>
      <p className="mb-4 text-[12.5px] text-[#8186a0]">
        The slides you kept — on your timeline forever.
      </p>

      {ready && moments.length === 0 ? (
        <div className="rounded-[18px] border-[1.5px] border-dashed border-[rgba(120,130,180,.3)] bg-white/50 px-[18px] py-[26px] text-center">
          <div className="mx-auto mb-3 grid h-[46px] w-[46px] place-items-center rounded-[14px] bg-white text-xl text-[#c9cee0] shadow-soft">
            ★
          </div>
          <div className="mb-1 text-sm font-semibold">No moments yet</div>
          <div className="text-[13px] leading-[1.45] text-[#8186a0]">
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
              time={m.time}
              slideRef={m.slideRef}
              topic={m.topic}
              thumbnailUrl={m.thumbnailUrl}
              href={m.href}
              onRemove={() => onRemove(m.id)}
            />
          ))}
        </div>
      ) : null}

      {relatedPeople.length > 0 ? (
        <>
          <div className="mb-[11px] mt-6 text-[13px] font-semibold text-[#52566c]">
            In the room for you
          </div>
          <div className="flex flex-col gap-[9px]">
            {relatedPeople.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-[11px] rounded-[14px] bg-white px-[13px] py-[11px] [box-shadow:0_1px_3px_rgba(40,50,110,.06)]"
              >
                <Avatar name={p.name} src={p.image} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold">{p.name}</div>
                  <div className="text-[11.5px] text-[#8186a0]">{p.note}</div>
                </div>
                <Link
                  to="/people/$userId"
                  params={{ userId: p.id }}
                  className="rounded-full bg-pillow px-[11px] py-1.5 text-[12px] font-medium text-slate transition-colors hover:bg-[#e3e7f2]"
                >
                  Connect
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
          className="mt-[18px] block overflow-hidden rounded-2xl bg-white [box-shadow:0_1px_3px_rgba(40,50,110,.06),0_8px_18px_rgba(40,50,110,.05)]"
        >
          <Thumb tint="#e2eef0" height={76} radius={0}>
            <span className="absolute bottom-2 left-2.5 rounded-md bg-white/[.88] px-2 py-[3px] font-mono text-[10px] text-[#3f6173]">
              {relatedProject.slug} · live demo
            </span>
          </Thumb>
          <div className="px-3.5 py-[13px]">
            <Mono tone="ghost" className="mb-[5px] block text-[11px]">
              Related project
            </Mono>
            <div className="text-[14.5px] font-semibold tracking-[-0.01em]">
              {relatedProject.name}
            </div>
            {relatedProject.tagline ? (
              <div className="mt-[3px] text-[12.5px] leading-[1.4] text-mist">
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

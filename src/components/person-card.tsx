import { Link } from '@tanstack/react-router'
import { MapPin } from 'lucide-react'

import { Avatar, Tag, GlassCard } from '#/components/ui'
import type { Person } from '#/db/types'

/** Directory card: cover strip · overlapping avatar · intent chip · tags. */
export function PersonCard({ person }: { person: Person }) {
  const p = person.profile

  return (
    <Link to="/people/$userId" params={{ userId: person.id }}>
      <GlassCard
        className="pt-12"
        innerClassName="overflow-visible group flex flex-col overflow-hidden rounded-[18px] bg-white shadow-card transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-card-hover "
      >
        <div className="flex flex-1 flex-col px-[15px] pb-[15px]">
          <Avatar
            name={person.name}
            src={person.image}
            size={52}
            border="#fff"
            className="-mt-[26px] self-start"
          />

          <div className="mb-2.5 mt-2.5">
            <div className="text-[14.5px] font-semibold tracking-[-0.01em]">
              {person.name}
            </div>
            <div className="text-[12px] text-muted">
              {p?.title}
              {p?.company ? ` · ${p.company}` : ''}
            </div>
          </div>

          {p?.location && (
            <div className="mb-2.5 flex items-center gap-1.5 text-[11.5px] text-slate">
              <MapPin size={12} className="text-muted" /> {p.location}
            </div>
          )}

          {p?.intents?.[0] && (
            <div className="mb-2.5 inline-flex max-w-fit items-center gap-1.5 rounded-lg bg-[#eef1f7] px-2.5 py-1.5 text-[12px] font-medium text-ink-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-lime" />
              {p.intents[0]}
            </div>
          )}

          <div className="mb-3.5 flex flex-wrap gap-1.5">
            {(p?.interestedTopics ?? []).slice(0, 3).map((t) => (
              <Tag key={t} className="!px-2 !py-0.5 !text-[11.5px]">
                {t}
              </Tag>
            ))}
          </div>

          <span className="mt-auto rounded-[11px] bg-pillow py-2 text-center text-[13px] font-medium text-slate transition-colors group-hover:bg-[#e6e9f3]">
            Connect
          </span>
        </div>
      </GlassCard>
    </Link>
  )
}

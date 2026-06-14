import { Link } from '@tanstack/react-router'
import { Star } from 'lucide-react'

import { Avatar, Tag, Thumb, paletteFor } from '#/components/ui'
import type { ProjectWithOwner } from '#/lib/queries'
import { formatCount } from '#/lib/format'
import { cn } from '#/lib/utils'

/** Discover-carousel card: tinted cover · squircle avatar · seeks/stars footer. */
export function ProjectCard({ project }: { project: ProjectWithOwner }) {
  const pal = paletteFor(project.name)

  return (
    <Link
      to="/projects/$slug"
      params={{ slug: project.slug }}
      className={cn(
        'flex w-[236px] shrink-0 snap-start flex-col overflow-hidden',
        'rounded-[18px] bg-white shadow-card',
        'transition-[transform,box-shadow] duration-200',
        'hover:-translate-y-[3px] hover:shadow-card-hover',
      )}
    >
      <Thumb tint={pal.bg} height={104} radius={0}>
        <Avatar
          name={project.name}
          initials={project.name.slice(0, 2)}
          shape="squircle"
          size={34}
          className={cn(
            'absolute left-2.5 top-2.5',
            'shadow-[0_2px_6px_rgba(40,50,110,.14)]',
          )}
        />
        <span
          className={cn(
            'absolute bottom-2.5 right-2.5',
            'font-mono text-micro text-slate',
            'rounded-md bg-white/[0.86] px-2 py-0.5',
          )}
        >
          {project.category}
        </span>
      </Thumb>

      <div className="flex flex-1 flex-col p-[15px]">
        <div className="mb-1.5 text-base font-semibold tracking-snug">
          {project.name}
        </div>
        <p className="mb-3.5 flex-1 text-note leading-body text-slate">
          {project.tagline}
        </p>
        <div
          className={cn(
            'flex items-center justify-between pt-2.5',
            'border-t border-dashed border-edge/20',
          )}
        >
          {project.lookingFor?.[0] && (
            <Tag variant="soft" className="!rounded-full !text-tiny">
              seeks {project.lookingFor[0]}
            </Tag>
          )}
          <span className="flex items-center gap-1 font-mono text-caption text-muted">
            <Star size={13} className="fill-slate text-slate" />
            {formatCount(project.trendingScore)}
          </span>
        </div>
      </div>
    </Link>
  )
}

import { Link } from '@tanstack/react-router'

import { Avatar, Tag, Thumb, paletteFor } from '#/components/ui'
import type { ProjectWithOwner } from '#/lib/queries'
import { formatCount } from '#/lib/format'

/** Discover-carousel card: tinted cover · squircle avatar · seeks/stars footer. */
export function ProjectCard({ project }: { project: ProjectWithOwner }) {
  const pal = paletteFor(project.name)

  return (
    <Link
      to="/projects/$slug"
      params={{ slug: project.slug }}
      className="flex w-[236px] shrink-0 flex-col overflow-hidden rounded-[18px] bg-white shadow-card transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-card-hover"
      style={{ scrollSnapAlign: 'start' }}
    >
      <Thumb tint={pal.bg} height={104} radius={0}>
        <Avatar
          name={project.name}
          initials={project.name.slice(0, 2)}
          shape="squircle"
          size={34}
          className="absolute left-2.5 top-2.5 shadow-[0_2px_6px_rgba(40,50,110,.14)]"
        />
        <span className="absolute bottom-2.5 right-2.5 rounded-md bg-white/[0.86] px-2 py-0.5 font-mono text-[10px] text-slate">
          {project.category}
        </span>
      </Thumb>

      <div className="flex flex-1 flex-col p-[15px]">
        <div className="mb-1.5 text-[16px] font-semibold tracking-[-0.01em]">
          {project.name}
        </div>
        <p className="mb-3.5 flex-1 text-[13px] leading-[1.45] text-slate">
          {project.tagline}
        </p>
        <div className="flex items-center justify-between border-t border-dashed border-[rgba(120,130,180,.2)] pt-2.5">
          {project.lookingFor?.[0] && (
            <Tag variant="soft" className="!rounded-full !text-[11.5px]">
              seeks {project.lookingFor[0]}
            </Tag>
          )}
          <span className="flex items-center gap-1 font-mono text-[12px] text-muted">
            <span className="text-slate">★</span>
            {formatCount(project.trendingScore)}
          </span>
        </div>
      </div>
    </Link>
  )
}

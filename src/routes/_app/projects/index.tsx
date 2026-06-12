import { useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, CornerDownRight, Star } from 'lucide-react'

import {
  Avatar,
  AvatarStack,
  Badge,
  Button,
  Mono,
  Pill,
  Tag,
  Thumb,
} from '#/components/ui'
import { ProjectCard } from '#/components/project-card'
import { listProjects, listSessions } from '#/lib/queries'
import type { ProjectWithOwner } from '#/lib/queries'
import { formatClock, formatCount } from '#/lib/format'

export const Route = createFileRoute('/_app/projects/')({
  loader: async () => ({
    projects: await listProjects(),
    sessions: await listSessions(),
  }),
  component: ProjectsPage,
})

const CATEGORIES = [
  'All',
  'Frameworks',
  'AI & agents',
  'React Native',
  'Trending',
]

function ProjectsPage() {
  const { projects, sessions } = Route.useLoaderData()
  const carousel = useRef<HTMLDivElement>(null)
  const scroll = (dir: number) =>
    carousel.current?.scrollBy({ left: dir * 500, behavior: 'smooth' })

  const featured =
    projects.reduce<(typeof projects)[0] | undefined>(
      (best, p) =>
        !best || (p.trendingScore ?? 0) > (best.trendingScore ?? 0) ? p : best,
      undefined,
    ) ?? projects[0]
  const relatedTalk = featured
    ? sessions.find((s) => s.speakerId === featured.ownerId)
    : undefined

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">
        Projects — what people are actually building
      </h1>
      <p className="mb-5 mt-1 max-w-2xl text-[14.5px] text-mist">
        People care less about where you work than what you're building. The
        conference becomes a showcase of ideas, not employers.
      </p>

      <div className="mb-[22px] flex flex-wrap gap-2">
        {CATEGORIES.map((c, i) => (
          <Pill key={c} active={i === 0} elevated>
            {c}
          </Pill>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-[22px] lg:grid-cols-[1.45fr_1fr]">
        {/* Discover carousel */}
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[14px] font-semibold tracking-[-0.01em]">
              Discover{' '}
              <span className="text-[13px] font-normal text-faint">
                · {projects.length} shipping at the summit
              </span>
            </div>
            <div className="flex gap-1.5">
              <CarouselArrow dir="left" onClick={() => scroll(-1)} />
              <CarouselArrow dir="right" onClick={() => scroll(1)} />
            </div>
          </div>
          <div
            ref={carousel}
            className="flex gap-3.5 overflow-x-auto px-0.5 pb-3.5 pt-1 [scroll-snap-type:x_proximity] [scrollbar-width:none]"
          >
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>

        {featured && (
          <ProjectProfile project={featured} relatedTalk={relatedTalk} />
        )}
      </div>
    </div>
  )
}

function CarouselArrow({
  dir,
  onClick,
}: {
  dir: 'left' | 'right'
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === 'left' ? 'Previous' : 'Next'}
      className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-white text-slate shadow-soft transition-colors hover:bg-ink hover:text-white"
    >
      {dir === 'left' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </button>
  )
}

function ProjectProfile({
  project,
  relatedTalk,
}: {
  project: ProjectWithOwner
  relatedTalk?: { title: string; startsAt: string | Date | null }
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-card-lg">
      <Mono className="mb-3.5 block !text-[11px]">Project profile</Mono>

      <div className="mb-4 flex items-center gap-3.5">
        <Avatar
          name={project.name}
          initials={project.name.slice(0, 2)}
          shape="squircle"
          size={54}
        />
        <div>
          <div className="text-[22px] font-semibold tracking-[-0.02em]">
            {project.name}
          </div>
          <div className="text-[13px] text-muted">
            by {project.ownerName} · {project.category}
          </div>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-lime/[0.22] px-[11px] py-1.5 font-mono text-[13px] font-medium text-slate">
          <Star size={13} className="fill-current" />{' '}
          {formatCount(project.trendingScore)}
        </span>
      </div>

      <Thumb
        tint="#eef0f8"
        height={140}
        className="mb-4 flex items-end p-3 [box-shadow:inset_0_0_0_1px_rgba(120,130,180,.12)]"
      >
        <span className="rounded-md bg-white/[0.86] px-2.5 py-1 font-mono text-[11px] text-muted">
          project screenshot
        </span>
      </Thumb>

      <p className="mb-4 text-[14px] leading-[1.5] text-slate">
        {project.description ?? project.tagline}
      </p>

      <Mono className="mb-2 block !text-[12px]">Tech stack</Mono>
      <div className="mb-[18px] flex flex-wrap gap-1.5">
        {(project.techStack ?? []).map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>

      <div className="mb-3.5 flex items-center justify-between rounded-2xl bg-inner px-3.5 py-3">
        <div>
          <Mono className="!text-[11px]">Looking for</Mono>
          <div className="mt-0.5 text-[14px] font-semibold">
            {project.lookingFor?.join(' & ') ?? 'Collaborators'}
          </div>
        </div>
        <AvatarStack
          size={30}
          people={[{ name: project.ownerName ?? project.name }]}
        />
      </div>

      {relatedTalk && (
        <div className="mb-[18px] flex items-center gap-2 text-[13px] text-slate">
          <CornerDownRight size={14} className="text-slate" /> Related session ·
          “{relatedTalk.title}” · {formatClock(relatedTalk.startsAt)}
        </div>
      )}

      <div className="flex gap-2.5">
        <Button variant="dark" className="flex-1">
          Message {project.ownerName?.split(' ')[0] ?? 'creator'}
        </Button>
        <Badge
          tone="lime-soft"
          className="!rounded-[13px] !px-4 !py-3 !text-[13.5px]"
        >
          <Star size={15} /> Star
        </Badge>
      </div>
    </div>
  )
}

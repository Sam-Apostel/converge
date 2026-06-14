import { useMemo, useRef, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ChevronLeft,
  ChevronRight,
  CornerDownRight,
  Plus,
  Search,
  Star,
} from 'lucide-react'

import {
  Avatar,
  AvatarStack,
  Button,
  Mono,
  Pill,
  Tag,
  Thumb,
} from '#/components/ui'
import { MessageOwnerButton, StarButton } from '#/components/project-actions'
import { ProjectCard } from '#/components/project-card'
import { listProjects, listSessions } from '#/lib/queries'
import type { ProjectWithOwner } from '#/lib/queries'
import { formatClock, formatCount } from '#/lib/format'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/_app/projects/')({
  loader: async () => ({
    projects: await listProjects(),
    sessions: await listSessions(),
  }),
  component: ProjectsPage,
})

const TRENDING = 'Trending'
const ALL = 'All'

function ProjectsPage() {
  const { projects, sessions } = Route.useLoaderData()
  const carousel = useRef<HTMLDivElement>(null)
  const scroll = (dir: number) =>
    carousel.current?.scrollBy({ left: dir * 500, behavior: 'smooth' })

  // Categories derive from the real `project.category` values so the pills
  // actually match the data, plus the synthetic "All" / "Trending" views.
  const categories = useMemo(() => {
    const real = [...new Set(projects.map((p) => p.category).filter(Boolean))]
    return [ALL, TRENDING, ...(real as Array<string>)]
  }, [projects])
  const [category, setCategory] = useState<string>(ALL)
  const [query, setQuery] = useState('')

  const visibleProjects = useMemo(() => {
    const byCategory =
      category === ALL
        ? projects
        : category === TRENDING
          ? [...projects].sort(
              (a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0),
            )
          : projects.filter((p) => p.category === category)

    const q = query.trim().toLowerCase()
    if (!q) return byCategory
    return byCategory.filter((p) =>
      [p.name, p.tagline, p.description, p.ownerName, ...(p.techStack ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [projects, category, query])

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Projects — what people are actually building
          </h1>
          <p className="mb-5 mt-1 max-w-2xl text-body text-mist">
            People care less about where you work than what you're building. The
            conference becomes a showcase of ideas, not employers.
          </p>
        </div>
        <Link to="/projects/new">
          <Button variant="lime" size="sm">
            <Plus size={14} strokeWidth={2.5} /> Register a project
          </Button>
        </Link>
      </div>

      <div className="relative mb-3 max-w-md">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects, tech, makers…"
          aria-label="Search projects"
          className={cn(
            'w-full py-2.5 pl-10 pr-3.5',
            'text-body text-ink placeholder:text-faint',
            'rounded-full border border-edge/40 bg-white shadow-soft outline-none',
            'transition-colors focus:border-ink/30',
          )}
        />
      </div>

      <div className="mb-[22px] flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            aria-pressed={c === category}
          >
            <Pill active={c === category} elevated>
              {c}
            </Pill>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-[22px] lg:grid-cols-[1.45fr_1fr]">
        {/* Discover carousel */}
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-body font-semibold tracking-snug">
              Discover{' '}
              <span className="text-note font-normal text-faint">
                · {visibleProjects.length}{' '}
                {category === ALL
                  ? 'shipping at the summit'
                  : `in ${category}`}
              </span>
            </div>
            <div className="flex gap-1.5">
              <CarouselArrow dir="left" onClick={() => scroll(-1)} />
              <CarouselArrow dir="right" onClick={() => scroll(1)} />
            </div>
          </div>
          <div
            ref={carousel}
            className={cn(
              'flex gap-3.5 overflow-x-auto px-0.5 pb-3.5 pt-1',
              '[scroll-snap-type:x_proximity] [scrollbar-width:none]',
            )}
          >
            {visibleProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
            {visibleProjects.length === 0 && (
              <p className="px-1 py-6 text-note text-muted">
                {query
                  ? `No projects match "${query}".`
                  : `No projects in ${category} yet.`}
              </p>
            )}
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
      className={cn(
        'grid h-[34px] w-[34px] place-items-center',
        'rounded-[10px] bg-white text-slate shadow-soft',
        'transition-colors hover:bg-ink hover:text-white',
      )}
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
      <Mono className="mb-3.5 block !text-tiny">Project profile</Mono>

      <div className="mb-4 flex items-center gap-3.5">
        <Avatar
          name={project.name}
          initials={project.name.slice(0, 2)}
          shape="squircle"
          size={54}
        />
        <div>
          <div className="text-title font-semibold tracking-tight">
            {project.name}
          </div>
          <div className="text-note text-muted">
            by {project.ownerName} · {project.category}
          </div>
        </div>
        <span
          className={cn(
            'ml-auto inline-flex items-center gap-1 px-[11px] py-1.5',
            'font-mono text-note font-medium text-slate',
            'rounded-full bg-lime/[0.22]',
          )}
        >
          <Star size={13} className="fill-current" />{' '}
          {formatCount(project.trendingScore)}
        </span>
      </div>

      {project.screenshots?.[0] ? (
        <img
          src={project.screenshots[0]}
          alt={`${project.name} screenshot`}
          className="mb-4 h-[140px] w-full rounded-[14px] object-cover shadow-hairline"
        />
      ) : (
        <Thumb
          tint="#eef0f8"
          height={140}
          className="mb-4 flex items-end p-3 shadow-hairline"
        >
          <span className="rounded-md bg-white/[0.86] px-2.5 py-1 font-mono text-tiny text-muted">
            project screenshot
          </span>
        </Thumb>
      )}

      <p className="mb-4 text-body leading-normal text-slate">
        {project.description ?? project.tagline}
      </p>

      <Mono className="mb-2 block !text-caption">Tech stack</Mono>
      <div className="mb-[18px] flex flex-wrap gap-1.5">
        {(project.techStack ?? []).map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>

      <div className="mb-3.5 flex items-center justify-between rounded-2xl bg-inner px-3.5 py-3">
        <div>
          <Mono className="!text-tiny">Looking for</Mono>
          <div className="mt-0.5 text-body font-semibold">
            {project.lookingFor?.join(' & ') ?? 'Collaborators'}
          </div>
        </div>
        <AvatarStack
          size={30}
          people={[{ name: project.ownerName ?? project.name }]}
        />
      </div>

      {relatedTalk && (
        <div className="mb-[18px] flex items-center gap-2 text-note text-slate">
          <CornerDownRight size={14} className="text-slate" /> Related session ·
          “{relatedTalk.title}” · {formatClock(relatedTalk.startsAt)}
        </div>
      )}

      <div className="flex gap-2.5">
        <MessageOwnerButton
          ownerId={project.ownerId}
          ownerName={project.ownerName}
          className="flex-1"
        />
        <StarButton count={project.trendingScore ?? 0} />
      </div>
    </div>
  )
}

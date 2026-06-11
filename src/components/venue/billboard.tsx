import { AvatarStack, Badge, Mono, Spotlight, Tag } from '#/components/ui'
import { PersonCard } from '#/components/person-card'
import { ProjectCard } from '#/components/project-card'
import type { ProjectWithOwner } from '#/lib/queries'
import type { VenueDiscussion } from '#/lib/queries/venue'
import type { Person } from '#/db/types'
import { formatCount } from '#/lib/format'

type BillboardData = {
  projects: Array<ProjectWithOwner>
  discussions: Array<VenueDiscussion>
  people: Array<Person>
}

/** Dark hero band — the "stars are people and ideas" moment. */
function Hero({
  topProject,
  people,
  trendingTotal,
}: {
  topProject?: ProjectWithOwner
  people: Array<Person>
  trendingTotal: number
}) {
  return (
    <Spotlight glow="right" className="p-6 md:p-7">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <Mono tone="lime" className="!text-[11px]">
            On the billboard
          </Mono>
          <h2 className="mt-2 text-[26px] font-semibold leading-[1.15] tracking-[-0.02em]">
            Here, the stars are people and ideas — not sponsor logos.
          </h2>
          {topProject && (
            <p className="mt-3 text-[14px] leading-relaxed text-white/70">
              Trending now ·{' '}
              <span className="font-semibold text-white">
                {topProject.name}
              </span>{' '}
              {topProject.tagline}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
          {people.length > 0 && (
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <AvatarStack
                people={people.map((p) => ({
                  name: p.name,
                  src: p.image,
                }))}
                size={34}
                border="#1c1e2e"
                overflowBg="#99ff00"
                overflowInk="#13141d"
              />
              <div className="text-[12px] leading-tight text-white/70">
                <span className="block font-semibold text-white">
                  {people.length} speakers
                </span>
                on stage today
              </div>
            </div>
          )}
          <Badge tone="lime-soft" mono className="!text-[11px] text-white">
            ★ {formatCount(trendingTotal)} stars across the floor
          </Badge>
        </div>
      </div>
    </Spotlight>
  )
}

/** A single active-thread tile. */
function DiscussionTile({ discussion }: { discussion: VenueDiscussion }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[14px] font-semibold leading-snug tracking-[-0.01em]">
          {discussion.title}
        </div>
        <Badge tone="dark" mono className="shrink-0 !text-[10px]">
          {discussion.posts} posts
        </Badge>
      </div>
      {discussion.topic && (
        <Tag variant="soft" className="!max-w-fit !rounded-full !text-[11.5px]">
          #{discussion.topic}
        </Tag>
      )}
    </div>
  )
}

/** The conference billboard: trending ideas, active threads, featured people. */
export function Billboard({ projects, discussions, people }: BillboardData) {
  const trendingTotal = projects.reduce((sum, p) => sum + p.trendingScore, 0)

  return (
    <section className="flex flex-col gap-6">
      <Hero
        topProject={projects[0]}
        people={people}
        trendingTotal={trendingTotal}
      />

      {projects.length > 0 && (
        <div>
          <div className="mb-3 flex items-baseline gap-2">
            <Mono className="!text-[11px]">Trending projects</Mono>
            <span className="text-[12px] text-faint">
              what people are building
            </span>
          </div>
          <div className="flex gap-3.5 overflow-x-auto px-0.5 pb-3 pt-1 [scroll-snap-type:x_proximity] [scrollbar-width:none]">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_1.1fr]">
        {discussions.length > 0 && (
          <div>
            <div className="mb-3 flex items-baseline gap-2">
              <Mono className="!text-[11px]">Active discussions</Mono>
              <span className="text-[12px] text-faint">
                conversations in motion
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {discussions.map((discussion) => (
                <DiscussionTile key={discussion.id} discussion={discussion} />
              ))}
            </div>
          </div>
        )}

        {people.length > 0 && (
          <div>
            <div className="mb-3 flex items-baseline gap-2">
              <Mono className="!text-[11px]">Featured people</Mono>
              <span className="text-[12px] text-faint">on stage today</span>
            </div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {people.slice(0, 4).map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

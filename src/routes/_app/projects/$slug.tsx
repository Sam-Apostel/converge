import { Link, createFileRoute } from '@tanstack/react-router'

import {
  Avatar,
  AvatarStack,
  Badge,
  Button,
  Mono,
  Tag,
  Thumb,
} from '#/components/ui'
import { getProjectBySlug } from '#/lib/queries/profiles'
import { formatCount, formatTime } from '#/lib/format'

export const Route = createFileRoute('/_app/projects/$slug')({
  loader: ({ params }) => getProjectBySlug({ data: params.slug }),
  component: ProjectDetail,
})

function ProjectDetail() {
  const data = Route.useLoaderData()

  if (!data) return <NotFound />

  const { project, ownerName, members, relatedTalk } = data
  const ownerFirst = ownerName?.split(' ')[0] ?? 'creator'

  // The "looking for" stack: members, falling back to the owner.
  const stack = members.length
    ? members.map((m) => ({ name: m.name, src: m.image }))
    : ownerName
      ? [{ name: ownerName }]
      : []

  return (
    <div className="max-w-3xl">
      <Link
        to="/projects"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-mist transition-colors hover:text-slate"
      >
        ‹ Projects
      </Link>

      {/* identity */}
      <div className="mb-5 flex flex-wrap items-center gap-3.5">
        <Avatar
          name={project.name}
          initials={project.name.slice(0, 2)}
          shape="squircle"
          size={64}
        />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">
            {project.name}
          </h1>
          <div className="mt-1 text-[14px] text-muted">
            by {ownerName ?? 'unknown'}
            {project.category ? ` · ${project.category}` : ''}
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-lime/[0.22] px-3 py-1.5 font-mono text-[13px] font-medium text-slate">
          ★ {formatCount(project.trendingScore)}
        </span>
      </div>

      <Thumb
        tint="#eef0f8"
        height={200}
        className="mb-5 flex items-end p-3.5 [box-shadow:inset_0_0_0_1px_rgba(120,130,180,.12)]"
      >
        <span className="rounded-md bg-white/[0.86] px-2.5 py-1 font-mono text-[11px] text-muted">
          project screenshot
        </span>
      </Thumb>

      <p className="mb-5 text-[15px] leading-[1.55] text-slate">
        {project.description ?? project.tagline}
      </p>

      {project.techStack?.length ? (
        <>
          <Mono className="mb-2 block !text-[12px]">Tech stack</Mono>
          <div className="mb-5 flex flex-wrap gap-1.5">
            {project.techStack.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </>
      ) : null}

      <div className="mb-5 flex items-center justify-between rounded-2xl bg-inner px-4 py-3.5">
        <div>
          <Mono className="!text-[11px]">Looking for</Mono>
          <div className="mt-0.5 text-[14px] font-semibold">
            {project.lookingFor?.join(' & ') ?? 'Collaborators'}
          </div>
        </div>
        {stack.length > 0 && <AvatarStack size={32} people={stack} />}
      </div>

      {relatedTalk && (
        <div className="mb-6 flex items-center gap-2 text-[13px] text-slate">
          <span className="text-slate">↳</span> Related session · “
          {relatedTalk.title}” · {formatTime(relatedTalk.startsAt)}
        </div>
      )}

      <div className="flex flex-wrap gap-2.5">
        <Button variant="dark">Message {ownerFirst}</Button>
        <Badge
          tone="lime-soft"
          className="!rounded-[13px] !px-4 !py-3 !text-[13.5px]"
        >
          ★ Star
        </Badge>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="py-20 text-center">
      <Mono tone="ghost" className="!text-[12px] !tracking-[0.04em]">
        No such project
      </Mono>
      <p className="mt-3 text-[14px] text-mist">
        That project isn't here.{' '}
        <Link to="/projects" className="text-slate underline">
          Back to projects
        </Link>
        .
      </p>
    </div>
  )
}

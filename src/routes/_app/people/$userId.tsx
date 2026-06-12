import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowUpRight, Check, ChevronLeft, MapPin } from 'lucide-react'

import { Avatar, Button, Mono, Tag } from '#/components/ui'
import { getPersonById } from '#/lib/queries/profiles'
import type { ConnectionState, ProfileProject } from '#/lib/queries/profiles'

export const Route = createFileRoute('/_app/people/$userId')({
  loader: ({ params }) => getPersonById({ data: params.userId }),
  component: PersonDetail,
})

function PersonDetail() {
  const data = Route.useLoaderData()

  if (!data) return <NotFound />

  const { person, projects, connectionState } = data
  const p = person.profile

  return (
    <div className="max-w-3xl">
      <Link
        to="/people"
        className="mb-5 inline-flex items-center gap-1 text-[13px] text-mist transition-colors hover:text-slate"
      >
        <ChevronLeft size={15} /> People
      </Link>

      {/* identity */}
      <div className="mb-6 flex flex-wrap items-start gap-[18px]">
        <Avatar name={person.name} src={person.image} size={84} />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">
            {person.name}
          </h1>
          <div className="mt-1 text-[14.5px] text-muted">
            {p?.title}
            {p?.company ? ` · ${p.company}` : ''}
          </div>
          {p?.location && (
            <div className="mt-2 flex items-center gap-1.5 text-[12.5px] text-slate">
              <MapPin size={13} className="text-muted" /> {p.location}
            </div>
          )}
        </div>
        <ConnectButton toUserId={person.id} initial={connectionState} />
      </div>

      {p?.bio && (
        <div className="mb-[18px] rounded-2xl p-4 [background:linear-gradient(135deg,#f3ffe0,#eef0f8)]">
          <Mono tone="slate" className="mb-1.5 block !text-[11px]">
            Why I'm here
          </Mono>
          <p className="text-[15px] font-medium leading-[1.45] text-ink-2">
            {p.bio}
          </p>
        </div>
      )}

      {p?.currentFocus && (
        <div className="mb-5">
          <Mono className="mb-2 block !text-[11px]">Current focus</Mono>
          <p className="text-[14px] leading-[1.5] text-slate">
            {p.currentFocus}
          </p>
        </div>
      )}

      {(p?.interestedTopics?.length || p?.notInterestedTopics?.length) && (
        <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {p?.interestedTopics?.length ? (
            <div>
              <Mono tone="slate" className="mb-2.5 block !text-[11px]">
                Talk to me about
              </Mono>
              <div className="flex flex-wrap gap-1.5">
                {p.interestedTopics.map((t) => (
                  <Tag key={t} variant="lime">
                    {t}
                  </Tag>
                ))}
              </div>
            </div>
          ) : null}
          {p?.notInterestedTopics?.length ? (
            <div>
              <Mono tone="mute" className="mb-2.5 block !text-[11px]">
                Please don't
              </Mono>
              <div className="flex flex-wrap gap-1.5">
                {p.notInterestedTopics.map((t) => (
                  <Tag key={t} variant="strike">
                    {t}
                  </Tag>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {projects.length > 0 && (
        <div>
          <Mono className="mb-2.5 block !text-[11px]">Projects</Mono>
          <div className="flex flex-col gap-2.5">
            {projects.map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** Connect CTA: requests a connection, then reflects pending / connected. */
function ConnectButton({
  toUserId,
  initial,
}: {
  toUserId: string
  initial: ConnectionState
}) {
  const [state, setState] = useState<ConnectionState>(initial)
  const [busy, setBusy] = useState(false)

  if (state === 'accepted') {
    return (
      <Button variant="soft" disabled>
        <Check size={15} strokeWidth={2.5} /> Connected
      </Button>
    )
  }
  if (state === 'pending') {
    return (
      <Button variant="soft" disabled>
        Pending
      </Button>
    )
  }

  const connect = async () => {
    setBusy(true)
    setState('pending') // optimistic
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ toUserId }),
      })
      if (!res.ok) setState('none')
    } catch {
      setState('none')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button variant="dark" onClick={connect} disabled={busy}>
      Connect
    </Button>
  )
}

function ProjectRow({ project }: { project: ProfileProject }) {
  return (
    <Link
      to="/projects/$slug"
      params={{ slug: project.slug }}
      className="group flex items-center gap-3 rounded-[13px] bg-inner px-3.5 py-3 transition-colors hover:bg-[#eef0f8]"
    >
      <Avatar
        name={project.name}
        initials={project.name.slice(0, 2)}
        shape="squircle"
        size={36}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold">{project.name}</div>
        <div className="truncate text-[12px] text-muted">
          {project.tagline ?? project.category}
        </div>
      </div>
      <ArrowUpRight
        size={16}
        className="text-muted transition-colors group-hover:text-slate"
      />
    </Link>
  )
}

function NotFound() {
  return (
    <div className="py-20 text-center">
      <Mono tone="ghost" className="!text-[12px] !tracking-[0.04em]">
        No such person
      </Mono>
      <p className="mt-3 text-[14px] text-mist">
        That profile isn't here.{' '}
        <Link to="/people" className="text-slate underline">
          Back to people
        </Link>
        .
      </p>
    </div>
  )
}

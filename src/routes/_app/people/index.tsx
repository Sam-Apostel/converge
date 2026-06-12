import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ChipList,
  type ChipListChangeEvent,
} from '@progress/kendo-react-buttons'

import {
  Avatar,
  Button,
  GlassCard,
  Mono,
  Spotlight,
  Tag,
} from '#/components/ui'
import { PersonCard } from '#/components/person-card'
import { listPeople } from '#/lib/queries'
import type { Person } from '#/db/types'

export const Route = createFileRoute('/_app/people/')({
  loader: () => listPeople(),
  component: PeoplePage,
})

const INTENTS = [
  { text: 'All', value: 'all' },
  { text: 'Co-founders', value: 'co-founder' },
  { text: 'Hiring', value: 'hiring' },
  { text: 'Open to work', value: 'open-to-work' },
  { text: 'Learning AI', value: 'learning' },
  { text: 'Meeting makers', value: 'meeting' },
]

function PeoplePage() {
  const people = Route.useLoaderData()
  const [selectedIntent, setSelectedIntent] = useState('all')

  const filtered =
    selectedIntent === 'all'
      ? people
      : people.filter((p) =>
          p.profile?.intents?.some((i) =>
            i.toLowerCase().includes(selectedIntent),
          ),
        )
  const top = filtered[0] ?? people[0]
  const featured =
    people.find((p) => p.profile?.handle === 'kitze') ?? filtered[1] ?? top

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">
        People — before sessions
      </h1>
      <p className="mb-5 mt-1 max-w-2xl text-body text-mist">
        Converge makes people the primary object — searchable by intent, not
        just by name.
      </p>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <ChipList
          data={INTENTS}
          selection="single"
          value={selectedIntent}
          onChange={(e: ChipListChangeEvent) =>
            setSelectedIntent((e.value as string) ?? 'all')
          }
          className="converge-chips"
        />
      </div>

      {top && <TopMatch person={top} />}

      <div className="grid grid-cols-1 items-start gap-[22px] lg:grid-cols-[1.3fr_1fr]">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {filtered.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>

        {featured && <ProfilePanel person={featured} />}
      </div>

      <div className="py-14 text-center">
        <Mono tone="ghost" className="!text-caption !tracking-[0.04em]">
          The conference ends. The network remains.
        </Mono>
      </div>
    </div>
  )
}

function TopMatch({ person }: { person: Person }) {
  const navigate = useNavigate()
  const p = person.profile
  return (
    <Spotlight
      glow="right"
      className="mb-5 flex items-center gap-6 px-[26px] py-6"
      style={{
        background:
          'linear-gradient(115deg,#13141d 0%,#1b1e30 55%,#24330f 125%)',
      }}
    >
      <div className="flex min-w-[300px] flex-1 items-center gap-[18px]">
        <Avatar name={person.name} src={person.image} size={68} />
        <div>
          <Mono tone="lime" className="mb-1.5 block !text-tiny">
            You should meet
          </Mono>
          <div className="text-title font-semibold tracking-[-0.02em]">
            {person.name}
          </div>
          <div className="mb-3 text-note text-frost">
            {p?.title}
            {p?.company ? ` · ${p.company}` : ''}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {p?.interestedTopics?.[0] && (
              <span className="rounded-full bg-lime px-[11px] py-1 text-caption font-semibold text-ink-2">
                both into {p.interestedTopics[0]}
              </span>
            )}
            {p?.location && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-[11px] py-1 text-caption text-frost">
                <span className="h-1.5 w-1.5 rounded-full bg-lime-deep" />
                at {p.location} now
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2.5 mt-4">
        <Button
          variant="lime"
          onClick={() =>
            navigate({
              to: '/messages',
              search: { me: undefined, dm: person.id },
            })
          }
        >
          Say hi
        </Button>
        <Button
          variant="glass"
          onClick={() =>
            navigate({ to: '/people/$userId', params: { userId: person.id } })
          }
        >
          View profile
        </Button>
      </div>
    </Spotlight>
  )
}

/** Connect CTA used on the directory's profile panel: POST then reflect pending. */
function QuickConnect({ toUserId }: { toUserId: string }) {
  const [state, setState] = useState<'none' | 'pending'>('none')
  if (state === 'pending') {
    return (
      <Button size="sm" variant="soft" disabled>
        Pending
      </Button>
    )
  }
  return (
    <Button
      size="sm"
      variant="dark"
      onClick={async () => {
        setState('pending')
        try {
          const res = await fetch('/api/connections', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ toUserId }),
          })
          if (!res.ok) setState('none')
        } catch {
          setState('none')
        }
      }}
    >
      Connect
    </Button>
  )
}

function ProfilePanel({ person }: { person: Person }) {
  const p = person.profile
  return (
    <GlassCard innerClassName="p-[26px]">
      <div className="mb-5 flex items-start gap-[15px]">
        <Avatar name={person.name} src={person.image} size={62} />
        <div className="flex-1">
          <div className="text-title font-semibold tracking-[-0.02em]">
            {person.name}
          </div>
          <div className="text-note text-muted">
            {p?.title}
            {p?.company ? ` · ${p.company}` : ''}
          </div>
        </div>
        <QuickConnect toUserId={person.id} />
      </div>

      {p?.bio && (
        <div className="mb-[18px] rounded-2xl p-4 [background:linear-gradient(135deg,#f3ffe0,#eef0f8)]">
          <Mono tone="slate" className="mb-1.5 block !text-tiny">
            Why I'm here
          </Mono>
          <p className="text-reading font-medium leading-[1.45] text-ink-2">
            {p.bio}
          </p>
        </div>
      )}

      {p?.currentFocus && (
        <div className="mb-[18px]">
          <Mono className="mb-2 block !text-tiny">Current focus</Mono>
          <p className="text-body leading-[1.5] text-slate">{p.currentFocus}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3.5">
        <div>
          <Mono tone="slate" className="mb-2.5 block !text-tiny">
            Talk to me about
          </Mono>
          <div className="flex flex-wrap gap-1.5">
            {(p?.interestedTopics ?? []).map((t) => (
              <Tag key={t} variant="lime">
                {t}
              </Tag>
            ))}
          </div>
        </div>
        <div>
          <Mono tone="mute" className="mb-2.5 block !text-tiny">
            Please don't
          </Mono>
          <div className="flex flex-wrap gap-1.5">
            {(p?.notInterestedTopics ?? []).map((t) => (
              <Tag key={t} variant="strike">
                {t}
              </Tag>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

import { createFileRoute } from '@tanstack/react-router'

import {
  Avatar,
  Button,
  Mono,
  Pill,
  Spotlight,
  Tag,
} from '#/components/ui'
import { PersonCard } from '#/components/person-card'
import { listPeople } from '#/lib/queries'
import { demoMatch } from '#/lib/demo'
import type { Person } from '#/db/types'

export const Route = createFileRoute('/_app/people/')({
  loader: () => listPeople(),
  component: PeoplePage,
})

const INTENTS = [
  'Co-founders',
  'Hiring',
  'Open to work',
  'Learning AI',
  'Meeting makers',
]

function PeoplePage() {
  const people = Route.useLoaderData()
  const ranked = [...people].sort((a, b) => demoMatch(b.id) - demoMatch(a.id))
  const top = ranked[0]
  const featured =
    people.find((p) => p.profile?.handle === 'kitze') ?? ranked[1] ?? top

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">
        People — before sessions
      </h1>
      <p className="mb-5 mt-1 max-w-2xl text-[14.5px] text-mist">
        Converge makes people the primary object — searchable by intent, not just
        by name.
      </p>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Mono className="mr-1 !tracking-[0.04em] !text-[12px]">
          Filter by intent
        </Mono>
        {INTENTS.map((intent, i) => (
          <Pill key={intent} active={i === 0} tone="lime" elevated>
            {intent}
          </Pill>
        ))}
      </div>

      {top && <TopMatch person={top} />}

      <div className="grid grid-cols-1 items-start gap-[22px] lg:grid-cols-[1.3fr_1fr]">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {ranked.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>

        {featured && <ProfilePanel person={featured} />}
      </div>

      <div className="py-14 text-center">
        <Mono tone="ghost" className="!text-[12px] !tracking-[0.04em]">
          The conference ends. The network remains.
        </Mono>
      </div>
    </div>
  )
}

function TopMatch({ person }: { person: Person }) {
  const match = demoMatch(person.id)
  const p = person.profile
  return (
    <Spotlight
      glow="right"
      className="mb-5 flex flex-wrap items-center gap-6 px-[26px] py-6"
      style={{
        background:
          'linear-gradient(115deg,#13141d 0%,#1b1e30 55%,#24330f 125%)',
      }}
    >
      <div className="flex min-w-[300px] flex-1 items-center gap-[18px]">
        <Avatar
          name={person.name}
          src={person.image}
          size={68}
          ring={match}
          ringLabel={`${match}%`}
        />
        <div>
          <Mono tone="lime" className="mb-1.5 block !text-[11px]">
            Your top match right now
          </Mono>
          <div className="text-[22px] font-semibold tracking-[-0.02em]">
            {person.name}
          </div>
          <div className="mb-3 text-[13px] text-[#b9bcd0]">
            {p?.title}
            {p?.company ? ` · ${p.company}` : ''}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {p?.interestedTopics?.[0] && (
              <span className="rounded-full bg-lime px-[11px] py-1 text-[12px] font-semibold text-ink-2">
                both into {p.interestedTopics[0]}
              </span>
            )}
            {p?.location && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-[11px] py-1 text-[12px] text-[#dfe2e8]">
                <span className="h-1.5 w-1.5 rounded-full bg-lime-deep" />
                at {p.location} now
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2.5">
        <Button variant="lime">Say hi</Button>
        <Button variant="glass">View profile</Button>
      </div>
    </Spotlight>
  )
}

function ProfilePanel({ person }: { person: Person }) {
  const p = person.profile
  return (
    <div className="rounded-3xl bg-white p-[26px] shadow-card-lg">
      <div className="mb-5 flex items-start gap-[15px]">
        <Avatar name={person.name} src={person.image} size={62} />
        <div className="flex-1">
          <div className="text-[22px] font-semibold tracking-[-0.02em]">
            {person.name}
          </div>
          <div className="text-[13.5px] text-muted">
            {p?.title}
            {p?.company ? ` · ${p.company}` : ''}
          </div>
        </div>
        <Button size="sm" variant="dark">
          Connect
        </Button>
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
        <div className="mb-[18px]">
          <Mono className="mb-2 block !text-[11px]">Current focus</Mono>
          <p className="text-[14px] leading-[1.5] text-slate">{p.currentFocus}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3.5">
        <div>
          <Mono tone="slate" className="mb-2.5 block !text-[11px]">
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
          <Mono tone="mute" className="mb-2.5 block !text-[11px]">
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
    </div>
  )
}

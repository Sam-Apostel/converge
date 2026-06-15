import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ChipList,
  type ChipListChangeEvent,
} from '@progress/kendo-react-buttons'
import { Search } from 'lucide-react'

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
import { cn } from '#/lib/utils'
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

/** Free-text haystack: name plus the searchable profile fields. */
function matchesQuery(person: Person, q: string): boolean {
  if (!q) return true
  const p = person.profile
  const haystack = [
    person.name,
    p?.headline,
    p?.title,
    p?.company,
    p?.location,
    p?.currentFocus,
    ...(p?.interestedTopics ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term))
}

function PeoplePage() {
  const people = Route.useLoaderData()
  const [selectedIntent, setSelectedIntent] = useState('all')
  const [query, setQuery] = useState('')

  const filtered = people.filter((p) => {
    const intentOk =
      selectedIntent === 'all' ||
      p.profile?.intents?.some((i) =>
        i.toLowerCase().includes(selectedIntent),
      )
    return intentOk && matchesQuery(p, query)
  })
  const top = filtered[0] ?? people[0]
  const featured =
    people.find((p) => p.profile?.handle === 'kitze') ?? filtered[1] ?? top

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        People — before sessions
      </h1>
      <p className="mb-5 mt-1 max-w-2xl text-body text-mist">
        Converge makes people the primary object — searchable by intent, not
        just by name.
      </p>

      <div className="mb-5 flex flex-col gap-3">
        <div className="relative max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, focus, company…"
            aria-label="Search people"
            className={cn(
              'w-full py-2.5 pl-10 pr-3.5',
              'text-body text-ink placeholder:text-faint',
              'rounded-full border border-edge/40 bg-white shadow-soft outline-none',
              'transition-colors focus:border-ink/30',
            )}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
      </div>

      {top && <TopMatch person={top} />}

      <div className="grid grid-cols-1 items-start gap-[22px] lg:grid-cols-[1.3fr_1fr]">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {filtered.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full rounded-2xl border border-dashed border-edge/40 bg-white/60 p-6 text-body text-muted">
              No people match{query ? ` "${query}"` : ' that filter'}. Try a
              different search or intent.
            </p>
          )}
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
      className={cn(
        'mb-5 flex items-center gap-6 px-[26px] py-6',
        '![background-image:linear-gradient(115deg,#13141d_0%,#1b1e30_55%,#24330f_125%)]',
      )}
    >
      <div className="flex min-w-[300px] flex-1 items-center gap-[18px]">
        <Avatar name={person.name} src={person.image} size={68} />
        <div>
          <Mono tone="lime" className="mb-1.5 block !text-tiny">
            You should meet
          </Mono>
          <div className="text-title font-semibold tracking-tight">
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
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-[11px] py-1',
                  'text-caption text-frost',
                  'rounded-full bg-white/10',
                )}
              >
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
              search: { dm: person.id },
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
          <div className="text-title font-semibold tracking-tight">
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
        <div
          className={cn(
            'mb-[18px] p-4',
            'rounded-2xl [background:linear-gradient(135deg,#f3ffe0,#eef0f8)]',
          )}
        >
          <Mono tone="slate" className="mb-1.5 block !text-tiny">
            Why I'm here
          </Mono>
          <p className="text-reading font-medium leading-body text-ink-2">
            {p.bio}
          </p>
        </div>
      )}

      {p?.currentFocus && (
        <div className="mb-[18px]">
          <Mono className="mb-2 block !text-tiny">Current focus</Mono>
          <p className="text-body leading-normal text-slate">
            {p.currentFocus}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
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

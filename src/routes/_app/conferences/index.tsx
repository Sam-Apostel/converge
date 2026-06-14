import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { CalendarDays, Check, MapPin, Plus } from 'lucide-react'

import {
  Button,
  Field,
  Mono,
  SelectInput,
  Tag,
  TextInput,
} from '#/components/ui'
import {
  CONFERENCE_ROLES,
  createConference,
  getConferenceContext,
  joinConference,
  listMyConferenceRoles,
  setActiveConference,
} from '#/lib/queries/conferences'
import type { ConferenceSummary } from '#/lib/queries/conferences'

export const Route = createFileRoute('/_app/conferences/')({
  loader: async () => {
    const [context, roles] = await Promise.all([
      getConferenceContext(),
      listMyConferenceRoles(),
    ])
    return { ...context, roles }
  },
  component: ConferencesPage,
})

function dateRange(startsAt: string | null, endsAt: string | null): string {
  if (!startsAt) return 'Dates to be confirmed'
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  }
  const start = new Date(startsAt).toLocaleDateString(undefined, opts)
  if (!endsAt) return start
  const end = new Date(endsAt)
  if (new Date(startsAt).toDateString() === end.toDateString()) return start
  return `${start} – ${end.toLocaleDateString(undefined, opts)}`
}

function ConferencesPage() {
  const { conferences, activeId, roles } = Route.useLoaderData()
  const router = useRouter()
  const navigate = Route.useNavigate()
  const [creating, setCreating] = useState(false)

  const roleByConference = new Map(roles.map((r) => [r.conferenceId, r.role]))

  const browse = async (id: string) => {
    await setActiveConference({ data: id })
    await router.invalidate()
    await navigate({ to: '/sessions' })
  }

  const join = async (id: string, role: string) => {
    await joinConference({ data: { id, role } })
    await router.invalidate()
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">
            Conferences
          </h1>
          <p className="mt-1 max-w-2xl text-body text-mist">
            The events running at the summit. Pick one to make it active — the
            schedule, home, and concierge all follow your choice.
          </p>
        </div>
        <Button variant="lime" size="sm" onClick={() => setCreating((v) => !v)}>
          <Plus size={14} strokeWidth={2.5} /> New conference
        </Button>
      </header>

      {creating && (
        <CreateConferenceForm
          onCreated={async () => {
            setCreating(false)
            await router.invalidate()
            await navigate({ to: '/sessions' })
          }}
        />
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {conferences.map((conference) => (
          <ConferenceCard
            key={conference.id}
            conference={conference}
            active={conference.id === activeId}
            role={roleByConference.get(conference.id) ?? null}
            onBrowse={() => void browse(conference.id)}
            onJoin={(role) => void join(conference.id, role)}
          />
        ))}
      </div>
    </div>
  )
}

function CreateConferenceForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [venueName, setVenueName] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!name.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      await createConference({
        data: {
          name,
          tagline: tagline || undefined,
          venueName: venueName || undefined,
          startsAt: startsAt || undefined,
          endsAt: endsAt || undefined,
        },
      })
      onCreated()
    } catch {
      setError('Could not create the conference. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
      className="mb-6 rounded-3xl bg-white p-6 shadow-card"
    >
      <Mono className="mb-4 block !text-tiny">Organizer setup</Mono>
      <div className="flex flex-col gap-4">
        <Field label="Name">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. React Summit 2027"
            required
          />
        </Field>
        <Field label="Tagline">
          <TextInput
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="One line about the event"
          />
        </Field>
        <Field label="Venue">
          <TextInput
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            placeholder="Where it happens"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starts">
            <TextInput
              type="date"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </Field>
          <Field label="Ends">
            <TextInput
              type="date"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </Field>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button type="submit" variant="dark" disabled={busy || !name.trim()}>
          {busy ? 'Creating…' : 'Create conference'}
        </Button>
        <span className="text-note text-muted">
          You'll be added as the organizer.
        </span>
        {error ? <span className="text-note text-slate">{error}</span> : null}
      </div>
    </form>
  )
}

function ConferenceCard({
  conference,
  active,
  role,
  onBrowse,
  onJoin,
}: {
  conference: ConferenceSummary
  active: boolean
  role: string | null
  onBrowse: () => void
  onJoin: (role: string) => void
}) {
  const [pickedRole, setPickedRole] = useState<string>(role ?? 'attendee')

  return (
    <div
      className={`flex flex-col rounded-3xl bg-white p-6 shadow-card ${
        active ? 'ring-2 ring-lime/50' : ''
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-lg font-semibold text-white">
            {conference.name.charAt(0)}
          </span>
          <div>
            <h2 className="text-title font-semibold tracking-[-0.02em]">
              {conference.name}
            </h2>
            {conference.tagline ? (
              <p className="text-note text-muted">{conference.tagline}</p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {role ? (
            <span className="inline-flex items-center rounded-full bg-ink/[0.06] px-2.5 py-1 font-mono text-tiny font-medium text-slate">
              {role}
            </span>
          ) : null}
          {active ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-lime/[0.22] px-2.5 py-1 font-mono text-tiny font-medium text-lime-deep">
              <Check size={12} strokeWidth={2.5} /> Active
            </span>
          ) : null}
        </div>
      </div>

      <div className="mb-3.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-slate">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays size={13} className="text-muted" />
          {dateRange(conference.startsAt, conference.endsAt)}
        </span>
        {conference.venueName ? (
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={13} className="text-muted" />
            {conference.venueName}
          </span>
        ) : null}
      </div>

      <div className="mb-4 flex items-baseline gap-1.5 text-note text-slate">
        <span className="font-semibold text-ink">
          {conference.sessionCount}
        </span>
        talks across
        <span className="font-semibold text-ink">
          {conference.tracks.length || 1}
        </span>
        {conference.tracks.length === 1 ? 'track' : 'tracks'}
      </div>

      {conference.tracks.length > 0 ? (
        <>
          <Mono className="mb-2 block !text-tiny">Tracks</Mono>
          <div className="mb-5 flex flex-wrap gap-1.5">
            {conference.tracks.map((track) => (
              <Tag key={track} variant="soft">
                {track}
              </Tag>
            ))}
          </div>
        </>
      ) : null}

      <div className="mt-auto flex flex-wrap items-end gap-2.5">
        <Button variant={active ? 'soft' : 'dark'} onClick={onBrowse}>
          {active ? 'Browse schedule' : 'Switch & browse schedule'}
        </Button>
        <div className="flex items-end gap-2">
          <div className="w-36">
            <Field label="Role">
              <SelectInput
                value={pickedRole}
                onChange={(e) => setPickedRole(e.target.value)}
              >
                {CONFERENCE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <Button variant="soft" onClick={() => onJoin(pickedRole)}>
            {role ? 'Update role' : 'Join'}
          </Button>
        </div>
      </div>
    </div>
  )
}

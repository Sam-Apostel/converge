import { useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import {
  ArrowUpRight,
  Bookmark,
  Plus,
  Settings as SettingsIcon,
} from 'lucide-react'

import { AvatarUpload } from '#/components/avatar-upload'
import { PageHeader } from '#/components/page-header'
import {
  Avatar,
  Button,
  Field,
  Mono,
  SelectInput,
  TagListInput,
  TextAreaInput,
  TextInput,
} from '#/components/ui'
import { authClient, useSession } from '#/lib/auth-client'
import { getMyProfile, saveMyProfile } from '#/lib/queries/me'
import type { MyProfile } from '#/lib/queries/me'
import type { ProfileProject } from '#/lib/queries/profiles'

export const Route = createFileRoute('/_app/profile')({
  loader: () => getMyProfile(),
  component: ProfilePage,
})

const AVAILABILITY = [
  { value: 'open', label: 'Open to meet' },
  { value: 'busy', label: 'Busy — sessions first' },
  { value: 'dnd', label: 'Do not disturb' },
] as const

const SOCIAL_KEYS = ['github', 'x', 'linkedin', 'website'] as const

type FormState = {
  name: string
  handle: string
  headline: string
  title: string
  company: string
  location: string
  bio: string
  currentFocus: string
  intents: Array<string>
  interestedTopics: Array<string>
  notInterestedTopics: Array<string>
  availability: string
  socials: Record<string, string>
}

function toForm(data: MyProfile): FormState {
  const p = data.profile
  return {
    name: data.user.name,
    handle: p?.handle ?? '',
    headline: p?.headline ?? '',
    title: p?.title ?? '',
    company: p?.company ?? '',
    location: p?.location ?? '',
    bio: p?.bio ?? '',
    currentFocus: p?.currentFocus ?? '',
    intents: p?.intents ?? [],
    interestedTopics: p?.interestedTopics ?? [],
    notInterestedTopics: p?.notInterestedTopics ?? [],
    availability: p?.availability ?? 'open',
    socials: p?.socials ?? {},
  }
}

function ProfilePage() {
  const data = Route.useLoaderData()
  const { data: session } = useSession()
  const router = useRouter()

  if (!data) {
    return (
      <div>
        <PageHeader title="Profile" />
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
          <p className="text-body text-muted">You're not signed in.</p>
          <Link
            to="/login"
            search={{ redirect: undefined }}
            className="mt-3 inline-block"
          >
            <Button variant="dark">Sign in</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Profile"
        subtitle="Your identity, intent, current focus, conversation preferences and projects."
        actions={
          <div className="flex items-center gap-2.5">
            <Link to="/moments">
              <Button variant="soft" size="sm">
                <Bookmark size={14} /> My moments
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="soft" size="sm">
                <SettingsIcon size={14} /> AI settings
              </Button>
            </Link>
            {session ? (
              <Button
                variant="soft"
                size="sm"
                onClick={() =>
                  void authClient
                    .signOut()
                    .then(() =>
                      router.navigate({
                        to: '/login',
                        search: { redirect: undefined },
                      }),
                    )
                }
              >
                Sign out
              </Button>
            ) : null}
          </div>
        }
      />

      <ProfileEditor key={data.user.id} data={data} />

      <MyProjects projects={data.projects} />
    </div>
  )
}

function ProfileEditor({ data }: { data: MyProfile }) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(() => toForm(data))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const socials = Object.fromEntries(
        Object.entries(form.socials)
          .map(([k, v]) => [k, v.trim()])
          .filter(([, v]) => v),
      )
      const fresh = await saveMyProfile({ data: { ...form, socials } })
      if (fresh) setForm(toForm(fresh))
      setSaved(true)
      await router.invalidate()
    } finally {
      setSaving(false)
    }
  }

  const handleAvatar = async (url: string) => {
    await saveMyProfile({ data: { image: url } })
    await router.invalidate()
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void handleSave()
      }}
      className="flex flex-col gap-5"
    >
      {/* identity */}
      <div className="flex flex-wrap items-start gap-5 rounded-3xl bg-white p-6 shadow-card">
        <AvatarUpload
          name={form.name || data.user.name}
          src={data.user.image}
          size={84}
          onUploaded={handleAvatar}
        />
        <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
          <Field label="Name">
            <TextInput
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
            />
          </Field>
          <Field label="Handle">
            <TextInput
              value={form.handle}
              onChange={(e) => set('handle', e.target.value)}
              placeholder="@you"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Headline" hint={data.user.email}>
              <TextInput
                value={form.headline}
                onChange={(e) => set('headline', e.target.value)}
                placeholder="One line that says what you're about"
              />
            </Field>
          </div>
        </div>
      </div>

      {/* work + whereabouts */}
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <Mono className="mb-4 block !text-tiny">Work & whereabouts</Mono>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Title">
            <TextInput
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Design engineer"
            />
          </Field>
          <Field label="Company">
            <TextInput
              value={form.company}
              onChange={(e) => set('company', e.target.value)}
              placeholder="Independent"
            />
          </Field>
          <Field label="Location">
            <TextInput
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="Antwerp, BE"
            />
          </Field>
        </div>
      </div>

      {/* story */}
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <Mono className="mb-4 block !text-tiny">Your story</Mono>
        <div className="flex flex-col gap-4">
          <Field label="Why I'm here">
            <TextAreaInput
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
              rows={3}
              placeholder="What brings you to the conference?"
            />
          </Field>
          <Field label="Current focus">
            <TextInput
              value={form.currentFocus}
              onChange={(e) => set('currentFocus', e.target.value)}
              placeholder="What are you working on right now?"
            />
          </Field>
          <Field
            label="Intents"
            hint="Why you're here — shown on your card and used for matching."
          >
            <TagListInput
              value={form.intents}
              onChange={(v) => set('intents', v)}
              placeholder="co-founder, hiring, learning AI…"
            />
          </Field>
        </div>
      </div>

      {/* conversation preferences */}
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <Mono className="mb-4 block !text-tiny">Conversation preferences</Mono>
        <div className="flex flex-col gap-4">
          <Field label="Talk to me about">
            <TagListInput
              value={form.interestedTopics}
              onChange={(v) => set('interestedTopics', v)}
              placeholder="RSCs, local-first, dev tools…"
            />
          </Field>
          <Field label="Please don't">
            <TagListInput
              value={form.notInterestedTopics}
              onChange={(v) => set('notInterestedTopics', v)}
              placeholder="crypto, cold pitches…"
            />
          </Field>
          <Field label="Availability">
            <SelectInput
              value={form.availability}
              onChange={(e) => set('availability', e.target.value)}
            >
              {AVAILABILITY.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
      </div>

      {/* socials */}
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <Mono className="mb-4 block !text-tiny">Links</Mono>
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_KEYS.map((key) => (
            <Field key={key} label={key === 'x' ? 'X / Twitter' : key}>
              <TextInput
                value={form.socials[key] ?? ''}
                onChange={(e) =>
                  set('socials', { ...form.socials, [key]: e.target.value })
                }
                placeholder={
                  key === 'website' ? 'https://…' : `https://${key}.com/you`
                }
              />
            </Field>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="dark" disabled={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </Button>
        {saved ? (
          <span className="text-note font-medium text-lime-deep">Saved</span>
        ) : null}
        <Link
          to="/people/$userId"
          params={{ userId: data.user.id }}
          className="ml-auto inline-flex items-center gap-1 text-note text-mist transition-colors hover:text-slate"
        >
          View public profile <ArrowUpRight size={14} />
        </Link>
      </div>
    </form>
  )
}

function MyProjects({ projects }: { projects: Array<ProfileProject> }) {
  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <Mono className="block !text-tiny">My projects</Mono>
        <Link to="/projects/new">
          <Button variant="lime" size="sm">
            <Plus size={14} strokeWidth={2.5} /> Register a project
          </Button>
        </Link>
      </div>
      {projects.length === 0 ? (
        <div className="rounded-2xl bg-inner px-4 py-5 text-body text-muted">
          Nothing registered yet — show people what you're building.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {projects.map((project) => (
            <Link
              key={project.id}
              to="/projects/$slug"
              params={{ slug: project.slug }}
              className="group flex items-center gap-3 rounded-[13px] bg-inner px-3.5 py-3 transition-colors hover:bg-pillow"
            >
              <Avatar
                name={project.name}
                initials={project.name.slice(0, 2)}
                shape="squircle"
                size={36}
              />
              <div className="min-w-0 flex-1">
                <div className="text-body font-semibold">{project.name}</div>
                <div className="truncate text-caption text-muted">
                  {project.tagline ?? project.category}
                </div>
              </div>
              <ArrowUpRight
                size={16}
                className="text-muted transition-colors group-hover:text-slate"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

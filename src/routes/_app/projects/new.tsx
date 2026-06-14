import { useRef, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChevronLeft, ImagePlus, X } from 'lucide-react'

import {
  Button,
  Field,
  Mono,
  SelectInput,
  TagListInput,
  TextAreaInput,
  TextInput,
} from '#/components/ui'
import type { Project } from '#/db/types'

export const Route = createFileRoute('/_app/projects/new')({
  component: RegisterProjectPage,
})

const CATEGORIES = [
  'startup',
  'side-project',
  'research',
  'open-source',
  'product',
] as const

const LINK_KEYS = ['github', 'website', 'demo'] as const

function RegisterProjectPage() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('side-project')
  const [techStack, setTechStack] = useState<Array<string>>([])
  const [lookingFor, setLookingFor] = useState<Array<string>>([])
  const [links, setLinks] = useState<Record<string, string>>({})
  const [screenshot, setScreenshot] = useState<{
    url: string
    preview: string
  } | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const cleanLinks = Object.fromEntries(
        Object.entries(links)
          .map(([k, v]) => [k, v.trim()])
          .filter(([, v]) => v),
      )
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          tagline,
          description,
          category,
          techStack,
          lookingFor,
          links: cleanLinks,
          screenshots: screenshot ? [screenshot.url] : [],
        }),
      })
      if (res.status === 401) {
        setError('Sign in to register a project.')
        return
      }
      if (!res.ok) {
        setError((await res.text()) || 'Something went wrong — try again.')
        return
      }
      const project = (await res.json()) as Project
      await navigate({ to: '/projects/$slug', params: { slug: project.slug } })
    } catch {
      setError('Something went wrong — try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <Link
        to="/projects"
        className="mb-5 inline-flex items-center gap-1 text-note text-mist transition-colors hover:text-slate"
      >
        <ChevronLeft size={15} /> Projects
      </Link>

      <h1 className="text-2xl font-semibold tracking-[-0.02em]">
        Register your project
      </h1>
      <p className="mb-6 mt-1 text-body text-mist">
        Put what you're building on the showcase — people connect over projects,
        not job titles.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void handleSubmit()
        }}
        className="flex flex-col gap-5"
      >
        <div className="rounded-3xl bg-white p-6 shadow-card">
          <Mono className="mb-4 block !text-tiny">The basics</Mono>
          <div className="flex flex-col gap-4">
            <Field label="Name">
              <TextInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What's it called?"
                required
              />
            </Field>
            <Field label="Tagline">
              <TextInput
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="One line that makes people stop scrolling"
              />
            </Field>
            <Field label="Description">
              <TextAreaInput
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="What does it do, who is it for, and what's the state of it?"
              />
            </Field>
            <Field label="Category">
              <SelectInput
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace('-', ' ')}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-card">
          <Mono className="mb-4 block !text-tiny">Show & tell</Mono>
          <div className="flex flex-col gap-4">
            <Field label="Screenshot">
              <ScreenshotPicker value={screenshot} onChange={setScreenshot} />
            </Field>
            <Field label="Tech stack">
              <TagListInput
                value={techStack}
                onChange={setTechStack}
                placeholder="React, Bun, Postgres…"
              />
            </Field>
            <Field
              label="Looking for"
              hint="What would move the project forward — surfaced to the right people."
            >
              <TagListInput
                value={lookingFor}
                onChange={setLookingFor}
                placeholder="co-founder, users, feedback…"
              />
            </Field>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-card">
          <Mono className="mb-4 block !text-tiny">Links</Mono>
          <div className="grid gap-4 sm:grid-cols-3">
            {LINK_KEYS.map((key) => (
              <Field key={key} label={key}>
                <TextInput
                  value={links[key] ?? ''}
                  onChange={(e) =>
                    setLinks((l) => ({ ...l, [key]: e.target.value }))
                  }
                  placeholder="https://…"
                />
              </Field>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" variant="dark" disabled={submitting || !name}>
            {submitting ? 'Registering…' : 'Register project'}
          </Button>
          {error ? <span className="text-note text-slate">{error}</span> : null}
        </div>
      </form>
    </div>
  )
}

/** Screenshot upload — posts to `/api/documents` and previews the result. */
function ScreenshotPicker({
  value,
  onChange,
}: {
  value: { url: string; preview: string } | null
  onChange: (next: { url: string; preview: string } | null) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pick = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      const form = new FormData()
      form.set('file', file)
      form.set('kind', 'project-screenshot')
      const res = await fetch('/api/documents', { method: 'POST', body: form })
      if (!res.ok) {
        setError(
          res.status === 401
            ? 'Sign in to upload.'
            : (await res.text()) || 'Upload failed',
        )
        return
      }
      const { url } = (await res.json()) as { url: string }
      onChange({ url, preview: URL.createObjectURL(file) })
    } catch {
      setError('Upload failed — try again.')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div>
      {value ? (
        <div className="relative overflow-hidden rounded-2xl">
          <img
            src={value.preview}
            alt="Project screenshot"
            className="max-h-[220px] w-full object-cover"
          />
          <button
            type="button"
            aria-label="Remove screenshot"
            onClick={() => onChange(null)}
            className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full bg-ink/60 text-white transition-colors hover:bg-ink"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="flex h-[120px] w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line bg-inner text-muted transition-colors hover:bg-pillow hover:text-slate"
        >
          <ImagePlus size={20} />
          <span className="text-caption font-medium">
            {busy ? 'Uploading…' : 'Add a screenshot (max 5MB)'}
          </span>
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => void pick(e.target.files?.[0])}
      />
      {error ? (
        <span className="mt-1.5 block text-caption text-slate">{error}</span>
      ) : null}
    </div>
  )
}

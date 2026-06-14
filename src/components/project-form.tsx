import { useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'

import {
  Button,
  Field,
  Mono,
  SelectInput,
  TagListInput,
  TextAreaInput,
  TextInput,
} from '#/components/ui'

const CATEGORIES = [
  'startup',
  'side-project',
  'research',
  'open-source',
  'product',
] as const

const LINK_KEYS = ['github', 'website', 'demo'] as const

export type ProjectFormValues = {
  name: string
  tagline: string
  description: string
  category: string
  techStack: Array<string>
  lookingFor: Array<string>
  links: Record<string, string>
  /** Stored document URL of the first screenshot, if any. */
  screenshotUrl: string | null
}

export const emptyProjectForm: ProjectFormValues = {
  name: '',
  tagline: '',
  description: '',
  category: 'side-project',
  techStack: [],
  lookingFor: [],
  links: {},
  screenshotUrl: null,
}

/**
 * Shared create/edit form for a project. Owns its field state, seeded from
 * `initial`; the parent supplies `onSubmit` (POST for new, PATCH for edit) and
 * the submit label. Used by `/projects/new` and `/projects/$slug/edit`.
 */
export function ProjectForm({
  initial,
  submitLabel,
  submittingLabel,
  onSubmit,
}: {
  initial: ProjectFormValues
  submitLabel: string
  submittingLabel: string
  onSubmit: (values: ProjectFormValues) => Promise<void>
}) {
  const [name, setName] = useState(initial.name)
  const [tagline, setTagline] = useState(initial.tagline)
  const [description, setDescription] = useState(initial.description)
  const [category, setCategory] = useState(initial.category || 'side-project')
  const [techStack, setTechStack] = useState(initial.techStack)
  const [lookingFor, setLookingFor] = useState(initial.lookingFor)
  const [links, setLinks] = useState(initial.links)
  const [screenshot, setScreenshot] = useState<{
    url: string
    preview: string
  } | null>(
    initial.screenshotUrl
      ? { url: initial.screenshotUrl, preview: initial.screenshotUrl }
      : null,
  )

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
      await onSubmit({
        name,
        tagline,
        description,
        category,
        techStack,
        lookingFor,
        links: cleanLinks,
        screenshotUrl: screenshot?.url ?? null,
      })
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Something went wrong — try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
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
        <Mono className="mb-4 block !text-tiny">Show &amp; tell</Mono>
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
          {submitting ? submittingLabel : submitLabel}
        </Button>
        {error ? <span className="text-note text-slate">{error}</span> : null}
      </div>
    </form>
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

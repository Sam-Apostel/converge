import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { MessageSquarePlus, SendHorizontal } from 'lucide-react'

import { Button, Card, Field, TextAreaInput, TextInput } from '#/components/ui'
import { useSession } from '#/lib/auth-client'

/**
 * Empty state for the discussions surface: when nothing's been opened yet, this
 * is the single call-to-action that gets the first thread going. The CTA expands
 * into an inline composer; on submit it creates the discussion and drops the
 * author straight into the new thread. Signed-out visitors get a sign-in nudge.
 */
export function StartDiscussion() {
  const { data: session } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    const t = title.trim()
    const b = body.trim()
    if (!t || !b || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: t, body: b }),
      })
      if (!res.ok) throw new Error(`create -> ${res.status}`)
      const { id } = (await res.json()) as { id: string }
      await router.navigate({ to: '/discussions/$id', params: { id } })
    } catch {
      setError('Could not start the discussion. Try again.')
      setBusy(false)
    }
  }

  return (
    <Card surface="white" className="flex flex-col items-center px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-inner text-ink-soft">
        <MessageSquarePlus size={22} strokeWidth={2} />
      </span>
      <h2 className="mt-4 text-title font-semibold tracking-tight">
        No discussions yet
      </h2>
      <p className="mt-1.5 max-w-md text-body text-muted">
        Ask the question that's on your mind — it becomes a thread the whole
        conference can pick up.
      </p>

      {!open ? (
        session?.user ? (
          <Button
            variant="dark"
            size="md"
            className="mt-6"
            onClick={() => setOpen(true)}
          >
            <MessageSquarePlus size={16} strokeWidth={2.25} /> Start the first
            discussion
          </Button>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-edge/40 bg-white/60 px-4 py-3 text-note text-muted">
            Sign in to start the first discussion.
          </p>
        )
      ) : (
        <div className="mt-6 flex w-full max-w-md flex-col gap-3 text-left">
          <Field label="Title">
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's the discussion about?"
              aria-label="Discussion title"
              maxLength={120}
              autoFocus
            />
          </Field>
          <Field label="Opening message">
            <TextAreaInput
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  void submit()
                }
              }}
              rows={4}
              placeholder="Kick things off…"
              aria-label="Opening message"
            />
          </Field>
          <div className="flex items-center justify-end gap-2.5">
            <Button
              variant="soft"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              variant="dark"
              size="sm"
              onClick={() => void submit()}
              disabled={busy || !title.trim() || !body.trim()}
            >
              <SendHorizontal size={14} /> Start discussion
            </Button>
          </div>
          {error && <p className="text-caption text-red-600">{error}</p>}
        </div>
      )}
    </Card>
  )
}

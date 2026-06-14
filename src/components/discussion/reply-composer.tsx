import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { SendHorizontal } from 'lucide-react'

import { Button } from '#/components/ui'
import { useSession } from '#/lib/auth-client'
import { cn } from '#/lib/utils'

/**
 * Reply box for a discussion thread. Posts to `/api/discussions/:id/posts` and
 * invalidates the route so the new post shows up in the thread. Signed-out
 * users get a nudge instead of a dead input.
 */
export function ReplyComposer({ discussionId }: { discussionId: string }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!session?.user) {
    return (
      <p className="mt-5 rounded-2xl border border-dashed border-edge/40 bg-white/60 p-4 text-note text-muted">
        Sign in to join this conversation.
      </p>
    )
  }

  const submit = async () => {
    const text = body.trim()
    if (!text || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/discussions/${discussionId}/posts`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body: text }),
      })
      if (!res.ok) throw new Error(`reply -> ${res.status}`)
      setBody('')
      router.invalidate()
    } catch {
      setError('Could not post your reply. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-5">
      <div
        className={cn(
          'flex items-end gap-2.5 p-2.5',
          'rounded-2xl border border-edge/30 bg-white shadow-soft',
          'focus-within:border-ink/30',
        )}
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              void submit()
            }
          }}
          rows={2}
          placeholder="Add to the conversation…"
          aria-label="Write a reply"
          className={cn(
            'min-h-10 flex-1 resize-none px-2 py-1.5',
            'text-body text-ink placeholder:text-faint',
            'bg-transparent outline-none',
          )}
        />
        <Button
          variant="dark"
          size="sm"
          onClick={() => void submit()}
          disabled={busy || !body.trim()}
        >
          <SendHorizontal size={14} /> Reply
        </Button>
      </div>
      {error && <p className="mt-2 text-caption text-red-600">{error}</p>}
    </div>
  )
}

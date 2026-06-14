import { useRef, useState } from 'react'
import { Camera } from 'lucide-react'

import { Avatar } from '#/components/ui'

const MAX_BYTES = 2 * 1024 * 1024

/**
 * The profile avatar with an upload affordance. Picking an image posts it to
 * `/api/documents` (kind `avatar`) and hands the served url back to the parent,
 * which persists it on `user.image`.
 */
export function AvatarUpload({
  name,
  src,
  size = 84,
  onUploaded,
}: {
  name?: string
  src?: string | null
  size?: number
  onUploaded: (url: string) => void | Promise<void>
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Instant local preview while the new url propagates through the session.
  const [preview, setPreview] = useState<string | null>(null)

  const pick = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    if (file.size > MAX_BYTES) {
      setError('Max 2MB — try a smaller image.')
      return
    }

    setBusy(true)
    try {
      const form = new FormData()
      form.set('file', file)
      form.set('kind', 'avatar')
      const res = await fetch('/api/documents', { method: 'POST', body: form })
      if (!res.ok) {
        setError((await res.text()) || 'Upload failed')
        return
      }
      const { url } = (await res.json()) as { url: string }
      setPreview(URL.createObjectURL(file))
      await onUploaded(url)
    } catch {
      setError('Upload failed — try again.')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-label="Change avatar"
        className="group relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-lime/60"
        style={{ width: size, height: size }}
      >
        <Avatar name={name} src={preview ?? src} size={size} />
        <span
          className={`absolute inset-0 grid place-items-center rounded-full bg-ink/45 text-white transition-opacity ${
            busy ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {busy ? (
            <span className="font-mono text-tiny">…</span>
          ) : (
            <Camera size={Math.max(16, Math.round(size * 0.24))} />
          )}
        </span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => void pick(e.target.files?.[0])}
      />
      {error ? (
        <span className="max-w-[160px] text-center text-caption text-slate">
          {error}
        </span>
      ) : null}
    </div>
  )
}

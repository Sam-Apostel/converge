import { useState } from 'react'

/**
 * The concierge input dock (silo 7) — opaque neumorphic card inside the glass
 * frame, with a lime send button (§1, Direction C).
 */
export function Composer({
  onSend,
  isLoading,
  onStop,
  disabled,
  placeholder = 'Ask anything…',
}: {
  onSend: (text: string) => void
  isLoading: boolean
  onStop: () => void
  disabled?: boolean
  placeholder?: string
}) {
  const [value, setValue] = useState('')

  const submit = () => {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue('')
  }

  return (
    <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-surface py-2.5 pl-4 pr-2.5 shadow-card [box-shadow:0_1px_3px_rgba(40,50,110,.08),inset_0_1px_0_rgba(255,255,255,.9)]">
      <span className="text-[16px] text-slate" aria-hidden>
        ✦
      </span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
          }
        }}
        disabled={disabled}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[14.5px] text-ink placeholder:text-muted focus:outline-none disabled:opacity-60"
      />
      {isLoading ? (
        <button
          type="button"
          onClick={onStop}
          aria-label="Stop"
          className="grid size-[38px] place-items-center rounded-xl bg-pillow text-slate transition-transform active:scale-95"
        >
          <span className="size-3 rounded-[3px] bg-ink" />
        </button>
      ) : (
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !value.trim()}
          aria-label="Send"
          className="grid size-[38px] place-items-center rounded-xl bg-ink text-[16px] text-lime transition-transform active:scale-95 disabled:opacity-40"
        >
          ↑
        </button>
      )}
    </div>
  )
}

import { useState } from 'react'
import { X } from 'lucide-react'
import type {
  InputHTMLAttributes,
  KeyboardEvent,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

/** Shared control styling — the settings-form input look. */
export const inputClass =
  'rounded-xl border border-line bg-inner px-3.5 py-2.5 text-body text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-lime/40'

/** Label + hint wrapper for any form control. */
export function Field({
  label,
  hint,
  children,
}: {
  label: ReactNode
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-note font-medium text-slate">{label}</span>
      {children}
      {hint ? <span className="text-caption text-muted">{hint}</span> : null}
    </label>
  )
}

export function TextInput({
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputClass} ${className}`} {...rest} />
}

export function TextAreaInput({
  className = '',
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`${inputClass} resize-y leading-[1.5] ${className}`}
      {...rest}
    />
  )
}

export function SelectInput({
  className = '',
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${inputClass} ${className}`} {...rest}>
      {children}
    </select>
  )
}

/**
 * Free-form tag list — type a value, press Enter (or comma) to add it, click
 * the × to remove. Backs array fields like tech stack and interested topics.
 */
export function TagListInput({
  value,
  onChange,
  placeholder,
}: {
  value: Array<string>
  onChange: (next: Array<string>) => void
  placeholder?: string
}) {
  const [draft, setDraft] = useState('')

  const commit = () => {
    const items = draft
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !value.includes(s))
    if (items.length) onChange([...value, ...items])
    setDraft('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div
      className={`${inputClass} flex flex-wrap items-center gap-1.5 !py-2 focus-within:ring-2 focus-within:ring-lime/40`}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-lg bg-tag px-2 py-1 text-caption font-medium text-slate"
        >
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="text-muted transition-colors hover:text-ink"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={value.length === 0 ? placeholder : undefined}
        className="min-w-[120px] flex-1 bg-transparent py-0.5 text-body text-ink placeholder:text-muted focus:outline-none"
      />
    </div>
  )
}

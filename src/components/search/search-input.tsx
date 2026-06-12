import { useEffect, useRef } from 'react'
import { Search } from 'lucide-react'

/**
 * The command-palette search field — reuses the Home command-bar styling
 * (`bg-pillow` inner shadow, lime caret) as a real, focusable input.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search people, projects, sessions, discussions…',
  autoFocus = true,
}: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  autoFocus?: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])

  return (
    <div className="flex items-center gap-3.5 rounded-[20px] bg-pillow px-[18px] py-[17px] [box-shadow:inset_2px_3px_7px_rgba(40,50,110,.1),inset_-2px_-2px_6px_rgba(255,255,255,.95)]">
      <Search size={19} className="text-[#7b809a]" />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className="flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-slate"
      />
      <span className="hidden items-center gap-1 font-mono text-[12px] text-muted sm:flex">
        <kbd className="rounded-md bg-white px-1.5 py-1 shadow-soft">⌘</kbd>
        <kbd className="rounded-md bg-white px-2 py-1 shadow-soft">K</kbd>
      </span>
    </div>
  )
}

import { Star } from 'lucide-react'

/** The "Moment saved to your rail" confirmation, pinned to the screen bottom. */
export function Toast({ show, label }: { show: boolean; label: string }) {
  if (!show) return null
  return (
    <div className="animate-toast-in absolute bottom-[22px] left-1/2 z-[5] flex -translate-x-1/2 items-center gap-[9px] rounded-full bg-ink px-5 py-3 text-sm font-medium text-white [box-shadow:0_12px_32px_rgba(20,20,40,.3)]">
      <Star size={15} className="fill-lime text-lime" /> {label}
    </div>
  )
}

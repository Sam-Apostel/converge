/** 1200 → "1.2k". */
export function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

/** A session start time → "Mon · 09:30". */
export function formatTime(value: string | Date | null): string {
  if (!value) return 'TBA'
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toLocaleString(undefined, {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Just the clock portion → "09:30". */
export function formatClock(value: string | Date | null): string {
  if (!value) return '--:--'
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

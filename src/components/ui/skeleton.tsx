import { cn } from '#/lib/utils'

type SkeletonShape = 'text' | 'rectangle' | 'circle'

const SHAPE: Record<SkeletonShape, string> = {
  text: 'rounded-md',
  rectangle: 'rounded-md',
  circle: 'rounded-full',
}

/**
 * Loading placeholder — a pulsing tinted block. Drop-in for the Kendo Skeleton
 * we used to use; size it with `className` (e.g. `h-3.5 w-3/5`).
 */
export function Skeleton({
  shape = 'rectangle',
  className,
}: {
  shape?: SkeletonShape
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'block animate-pulse bg-[#e3e6f4]',
        SHAPE[shape],
        className,
      )}
    />
  )
}

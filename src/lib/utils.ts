import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * The shadcn `cn` helper: compose conditional class lists with `clsx`
 * (objects/arrays/falsey-skipping) and then resolve Tailwind conflicts with
 * `tailwind-merge` so the last utility in a family wins. Prefer object syntax
 * (`{ 'bg-lime': active }`) over ternaries for conditional classes.
 */
export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}

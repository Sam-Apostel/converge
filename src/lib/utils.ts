import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/*
 * Our `@theme` defines named font-size tokens (`text-body`, `text-note`, …)
 * that tailwind-merge doesn't ship with. Without this, it can't tell
 * `text-body` (a size) from `text-ink` (a colour): it files both under the
 * text-colour group, decides they conflict, and drops whichever comes first —
 * silently stripping the colour off any element that carries both (e.g. the
 * Button recipe's `bg-ink text-white … text-body`, leaving black-on-black).
 * Registering the tokens as font-sizes keeps colour and size in separate
 * conflict groups so both survive a merge.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'micro',
            'tiny',
            'caption',
            'note',
            'body',
            'reading',
            'title',
          ],
        },
      ],
    },
  },
})

/**
 * The shadcn `cn` helper: compose conditional class lists with `clsx`
 * (objects/arrays/falsey-skipping) and then resolve Tailwind conflicts with
 * `tailwind-merge` so the last utility in a family wins. Prefer object syntax
 * (`{ 'bg-lime': active }`) over ternaries for conditional classes.
 */
export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}

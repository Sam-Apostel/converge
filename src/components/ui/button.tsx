import { cva } from 'cva'
import type { VariantProps } from 'cva'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '#/lib/utils'

/** Shared class recipe so links can look like buttons without wrapping. */
export const buttonVariants = cva({
  base: [
    'inline-flex items-center justify-center font-semibold leading-none',
    'transition-[transform,background-color,box-shadow] duration-150',
    'active:scale-[0.97]',
    'disabled:opacity-50 disabled:pointer-events-none',
  ],
  variants: {
    variant: {
      dark: 'bg-ink text-white hover:bg-ink-2',
      lime: 'bg-lime text-ink',
      soft: 'bg-pillow text-slate hover:bg-pillow-deep',
      glass: 'bg-white/10 text-white hover:bg-white/15',
    },
    size: {
      sm: 'h-9 gap-1.5 rounded-[11px] px-3.5 text-note',
      md: 'gap-2 rounded-[13px] px-5 py-3 text-body',
    },
  },
  defaultVariants: { variant: 'dark', size: 'md' },
})

export type ButtonVariant = NonNullable<
  VariantProps<typeof buttonVariants>['variant']
>
export type ButtonSize = NonNullable<
  VariantProps<typeof buttonVariants>['size']
>

export function Button({
  variant,
  size,
  className,
  children,
  ...rest
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...rest}
    >
      {children}
    </button>
  )
}

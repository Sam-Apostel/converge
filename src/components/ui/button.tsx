import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'dark' | 'lime' | 'soft' | 'glass'
export type ButtonSize = 'sm' | 'md'

const VARIANT: Record<ButtonVariant, string> = {
  dark: 'bg-ink text-white hover:bg-ink-2',
  lime: 'bg-lime text-ink ',
  soft: 'bg-pillow text-slate hover:bg-[#e3e7f2]',
  glass: 'bg-white/10 text-white hover:bg-white/15',
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[13px] rounded-[11px] gap-1.5',
  md: 'px-5 py-3 text-sm rounded-[13px] gap-2',
}

/** Shared class string so links can look like buttons without wrapping. */
function buttonClass(
  variant: ButtonVariant = 'dark',
  size: ButtonSize = 'md',
  className = '',
) {
  return `inline-flex items-center justify-center font-semibold leading-none transition-[transform,background-color,box-shadow] duration-150 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none ${VARIANT[variant]} ${SIZE[size]} ${className}`
}

export function Button({
  variant = 'dark',
  size = 'md',
  className = '',
  children,
  ...rest
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </button>
  )
}

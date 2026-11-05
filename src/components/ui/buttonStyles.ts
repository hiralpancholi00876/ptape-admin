export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-600 shadow-sm shadow-indigo-bloom/25',
  secondary:
    'bg-surface-900 text-zinc-100 hover:bg-surface-750 border border-surface-700 shadow-sm',
  ghost: 'bg-transparent text-zinc-400 hover:bg-hover hover:text-zinc-100',
  danger:
    'bg-danger/10 text-danger border border-danger/25 hover:bg-danger/15',
  outline:
    'bg-transparent text-zinc-200 border border-surface-600 hover:border-accent-500/40 hover:bg-hover hover:text-accent-500',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-11 px-5 text-sm gap-2 rounded-xl',
}

export function buttonClass(variant: ButtonVariant, size: ButtonSize, className = '') {
  return `inline-flex items-center justify-center whitespace-nowrap font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`
}

import { initials, tintFromName } from '../../lib/format'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-base',
  xl: 'size-20 text-xl',
}

export function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-surface-600 bg-linear-to-br font-semibold text-white ${tintFromName(name)} ${sizes[size]} ${className}`}
      aria-label={name}
    >
      <span>{initials(name)}</span>
    </div>
  )
}

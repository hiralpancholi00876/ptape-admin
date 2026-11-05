import { useState } from 'react'
import { initials, tintFromName } from '../../lib/format'

interface AvatarProps {
  src?: string | null
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

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  // Remember which src failed so a new src gets a fresh attempt.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showImage = Boolean(src) && src !== failedSrc

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-surface-600 font-semibold ${
        showImage ? 'bg-surface-750' : `bg-linear-to-br text-white ${tintFromName(name)}`
      } ${sizes[size]} ${className}`}
      aria-label={name}
    >
      {showImage ? (
        <img
          src={src!}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src!)}
          className="size-full object-cover"
        />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  )
}

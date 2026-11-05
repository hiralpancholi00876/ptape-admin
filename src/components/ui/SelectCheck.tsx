import { Check } from 'lucide-react'

interface SelectCheckProps {
  checked: boolean
  onChange: () => void
  label: string
  // Hidden until the card is hovered or focused, unless already checked.
  revealOnHover?: boolean
  className?: string
}

// Round selection mark for cards; a real checkbox underneath keeps keyboard and screen readers working.
export function SelectCheck({ checked, onChange, label, revealOnHover = false, className = '' }: SelectCheckProps) {
  return (
    <label
      className={`flex size-7 cursor-pointer items-center justify-center transition-opacity ${
        revealOnHover && !checked ? 'opacity-0 group-hover:opacity-100 focus-within:opacity-100' : 'opacity-100'
      } ${className}`}
    >
      <input type="checkbox" checked={checked} onChange={onChange} aria-label={label} className="peer sr-only" />
      <span
        aria-hidden
        className={`flex size-6 items-center justify-center rounded-full border-2 shadow-sm transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${
          checked ? 'border-accent-500 bg-accent-500 text-white' : 'border-white/80 bg-black/30 text-transparent hover:bg-black/50'
        }`}
      >
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    </label>
  )
}

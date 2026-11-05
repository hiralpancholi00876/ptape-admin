import { ChevronDown } from 'lucide-react'

interface Option {
  label: string
  value: string
}

interface FilterDropdownProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: Option[]
  className?: string
}

export function FilterDropdown({
  label,
  value,
  onChange,
  options,
  className = '',
}: FilterDropdownProps) {
  return (
    <label className={`relative block ${className}`}>
      {label && (
        <span className="mb-1.5 block text-xs font-medium text-zinc-500">
          {label}
        </span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full appearance-none rounded-xl border border-surface-600 bg-surface-900 pr-9 pl-3.5 text-sm text-zinc-100 transition focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/40"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-0 bottom-0 flex h-10 w-9 items-center justify-center text-zinc-500">
        <ChevronDown className="size-4 shrink-0" aria-hidden />
      </span>
    </label>
  )
}
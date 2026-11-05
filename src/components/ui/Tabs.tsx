import { useRef, type KeyboardEvent } from 'react'

interface TabOption<T extends string> {
  value: T
  label: string
  count?: number
}

interface TabsProps<T extends string> {
  label: string
  value: T
  onChange: (value: T) => void
  options: TabOption<T>[]
  className?: string
}

// Segmented tabs; arrow keys move between them like native tablists.
export function Tabs<T extends string>({ label, value, onChange, options, className = '' }: TabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null)

  const onKeyDown = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const index = options.findIndex((o) => o.value === value)
    const next = options[(index + step + options.length) % options.length]
    onChange(next.value)
    listRef.current?.querySelector<HTMLButtonElement>(`[data-value="${next.value}"]`)?.focus()
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`flex gap-1 overflow-x-auto rounded-xl bg-surface-750 p-1 scrollbar-thin ${className}`}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            data-value={option.value}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
              selected
                ? 'bg-surface-900 text-zinc-100 shadow-sm ring-1 ring-surface-600'
                : 'text-zinc-400 hover:bg-hover hover:text-zinc-100'
            }`}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={`min-w-5 rounded-full px-1.5 text-center text-xs tabular-nums ${
                  selected ? 'bg-accent-500 text-white' : 'bg-surface-700 text-zinc-400'
                }`}
              >
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

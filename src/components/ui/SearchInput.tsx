import type { Ref } from 'react'
import { Search, X } from 'lucide-react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  inputRef?: Ref<HTMLInputElement>
  // Key that focuses the field, shown as a hint while it is empty.
  shortcut?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
  inputRef,
  shortcut,
}: SearchInputProps) {
  return (
    <div className={`relative flex h-10 items-center ${className}`}>
      <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-10 items-center justify-center text-zinc-500">
        <Search className="size-4 shrink-0" aria-hidden />
      </span>
      <input
        ref={inputRef}
        type="search"
        name="search"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-surface-700 bg-surface-950 pr-9 pl-10 text-sm leading-none text-zinc-100 placeholder:text-zinc-500 shadow-sm transition focus:border-accent-500 focus:bg-surface-900 focus:outline-none focus:ring-2 focus:ring-ring [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
        aria-label={placeholder}
        aria-keyshortcuts={shortcut}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 z-10 flex w-9 items-center justify-center text-zinc-500 transition hover:text-zinc-300"
          aria-label="Clear search"
        >
          <X className="size-3.5 shrink-0" />
        </button>
      ) : (
        shortcut && (
          <kbd className="pointer-events-none absolute right-2.5 hidden rounded-md border border-surface-600 bg-surface-850 px-1.5 font-sans text-xs text-zinc-500 sm:block">
            {shortcut}
          </kbd>
        )
      )}
    </div>
  )
}

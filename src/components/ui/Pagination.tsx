import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
  disabled?: boolean
}

// First, last and two pages either side of the current one, with gaps as '…'.
function pageRange(page: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 1) return [1]

  const pages: number[] = [1]
  for (let i = page - 2; i <= page + 2; i++) {
    if (i > 1 && i < totalPages) pages.push(i)
  }
  pages.push(totalPages)

  const result: (number | '…')[] = []
  let last = 0
  for (const p of pages) {
    if (last) {
      if (p - last === 2) result.push(last + 1)
      else if (p - last !== 1) result.push('…')
    }
    result.push(p)
    last = p
  }
  return result
}

const iconButton =
  'rounded-lg p-2 text-zinc-400 transition hover:bg-hover hover:text-zinc-100 disabled:pointer-events-none disabled:opacity-30'

export function Pagination({ page, totalPages, onChange, disabled }: PaginationProps) {
  const go = (next: number) => {
    if (!disabled && next >= 1 && next <= totalPages && next !== page) onChange(next)
  }
  const atStart = page <= 1 || disabled
  const atEnd = page >= totalPages || disabled

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-1 rounded-2xl border border-surface-700 bg-surface-850 p-1.5 shadow-panel">
        <button type="button" className={iconButton} disabled={atStart} onClick={() => go(1)} aria-label="First page">
          <ChevronsLeft className="size-4" />
        </button>
        <button type="button" className={iconButton} disabled={atStart} onClick={() => go(page - 1)} aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </button>

        <span className="px-3 text-sm font-medium text-zinc-200 md:hidden">
          {page} / {totalPages}
        </span>
        <div className="hidden items-center gap-1 md:flex">
          {pageRange(page, totalPages).map((p, i) =>
            p === '…' ? (
              <span key={`gap-${i}`} className="px-1.5 text-sm text-zinc-500">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                disabled={disabled}
                onClick={() => go(p)}
                aria-current={p === page ? 'page' : undefined}
                className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition disabled:opacity-50 ${
                  p === page
                    ? 'bg-accent-500 text-white shadow-sm shadow-indigo-bloom/25'
                    : 'text-zinc-300 hover:bg-hover hover:text-zinc-100'
                }`}
              >
                {p}
              </button>
            ),
          )}
        </div>

        <button type="button" className={iconButton} disabled={atEnd} onClick={() => go(page + 1)} aria-label="Next page">
          <ChevronRight className="size-4" />
        </button>
        <button type="button" className={iconButton} disabled={atEnd} onClick={() => go(totalPages)} aria-label="Last page">
          <ChevronsRight className="size-4" />
        </button>
      </div>
      <p className="text-xs font-medium text-zinc-500">
        Page {page} of {totalPages}
      </p>
    </div>
  )
}

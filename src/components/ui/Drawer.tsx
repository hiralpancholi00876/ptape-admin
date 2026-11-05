import { useEffect, useEffectEvent, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { lockBodyScroll } from '../../lib/scrollLock'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
}

// A panel sliding in from the right, for working on one item without leaving the page.
export function Drawer({ open, onClose, title, description, children }: DrawerProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  const onEscape = useEffectEvent((e: KeyboardEvent) => {
    // Skip Escapes a control already handled (e.g. closing a select menu) or meant for a dialog on top.
    if (e.key !== 'Escape' || e.defaultPrevented) return
    if (document.querySelectorAll('[aria-modal="true"]').length === 1) onClose()
  })

  useEffect(() => {
    if (!open) return
    const returnFocus = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => onEscape(e)
    document.addEventListener('keydown', onKey)
    const unlock = lockBodyScroll()
    return () => {
      document.removeEventListener('keydown', onKey)
      unlock()
      returnFocus?.focus()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        tabIndex={-1}
        className="absolute inset-0 animate-fade-in bg-overlay backdrop-blur-[2px]"
        aria-label="Close panel"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full max-w-5xl animate-drawer-in flex-col border-l border-surface-600 bg-surface-950 shadow-2xl shadow-black/40 focus:outline-none"
      >
        <div className="flex items-start justify-between gap-4 border-b border-surface-700 bg-surface-850 px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-lg font-semibold text-zinc-100">
              {title}
            </h2>
            {description && <div className="mt-0.5 text-sm text-zinc-500">{description}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-hover hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label="Close panel"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-thin">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

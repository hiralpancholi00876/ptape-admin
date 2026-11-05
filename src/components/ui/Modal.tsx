import { useEffect, useEffectEvent, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { lockBodyScroll } from '../../lib/scrollLock'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const widths = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-6xl',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const titleId = useId()

  const onEscape = useEffectEvent((e: KeyboardEvent) => {
    // Skip Escapes a control already handled, like closing a select menu.
    if (e.key === 'Escape' && !e.defaultPrevented) onClose()
  })

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => onEscape(e)
    document.addEventListener('keydown', onKey)
    const unlock = lockBodyScroll()
    return () => {
      document.removeEventListener('keydown', onKey)
      unlock()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-overlay backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative w-full ${widths[size]} animate-in rounded-2xl border border-surface-600 bg-surface-850 shadow-2xl shadow-black/50`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-surface-700 px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-zinc-100">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-zinc-400">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-hover hover:text-zinc-100"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto overscroll-contain px-5 py-4 scrollbar-thin">
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-surface-700 px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

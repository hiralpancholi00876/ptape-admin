import { Info, X } from 'lucide-react'
import { Toaster as HotToaster, ToastBar, toast } from 'react-hot-toast'

// The app's single toast outlet. Call toast(), toast.success() or toast.error() from anywhere.
export function Toaster() {
  return (
    <HotToaster
      // Top-center keeps clear of the bulk-action bar and scroll button pinned to the bottom.
      position="top-center"
      gutter={8}
      toastOptions={{
        // CSS variables, so toasts follow the light/dark theme without re-rendering.
        style: {
          background: 'var(--surface-850)',
          color: 'var(--body-fg)',
          border: '1px solid var(--surface-700)',
          boxShadow: 'var(--shadow)',
          borderRadius: '0.75rem',
          fontSize: '0.875rem',
          padding: '0.5rem 0.75rem',
          maxWidth: '26rem',
        },
        success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--surface-850)' } },
        error: { iconTheme: { primary: 'var(--danger)', secondary: 'var(--surface-850)' } },
        loading: { iconTheme: { primary: 'var(--accent-500)', secondary: 'var(--surface-700)' } },
        // Plain toast() calls are informational.
        blank: { icon: <Info className="size-5 shrink-0 text-info" /> },
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <>
              {icon}
              {message}
              {t.type !== 'loading' && (
                <button
                  type="button"
                  onClick={() => toast.dismiss(t.id)}
                  className="rounded-md p-1 text-zinc-400 transition hover:bg-hover hover:text-zinc-200"
                  aria-label="Dismiss notification"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </>
          )}
        </ToastBar>
      )}
    </HotToaster>
  )
}

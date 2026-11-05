import { LogOut, Menu } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useUiStore } from '../../stores/uiStore'
import { ThemeToggle } from '../ui'

export function Header({ title }: { title: string }) {
  const logout = useAuthStore((state) => state.signOut)
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen)

  return (
    <header className="sticky top-0 z-30 border-b border-surface-700 bg-surface-850/90 shadow-panel backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="rounded-xl border border-surface-700 bg-surface-900 p-2 text-zinc-300 transition hover:bg-hover lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>

        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight text-balance text-zinc-100 sm:text-xl">
          {title}
        </h1>

        <ThemeToggle compact />

        <button
          type="button"
          onClick={logout}
          className="rounded-xl border border-surface-700 p-2.5 text-zinc-400 transition hover:bg-danger/10 hover:text-danger"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  )
}

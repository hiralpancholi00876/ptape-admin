import { NavLink, useLocation } from 'react-router-dom'
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  CloudUpload,
  Film,
  LogOut,
  Plus,
  Tags,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useDraftQueue } from '../../hooks/useDraftQueue'
import { useAuthStore } from '../../stores/authStore'
import { useUiStore, useVideoListHref } from '../../stores/uiStore'
import { ButtonLink, ThemeToggle } from '../ui'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  // Extra paths that count as this item being active.
  match?: RegExp
  showReadyCount?: boolean
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Publishing',
    items: [
      { to: '/video/drafts', label: 'Drafts', icon: CloudUpload, showReadyCount: true },
      // Videos stays highlighted on add/edit/details pages, but not on drafts, which has its own entry.
      { to: '/video/list', label: 'Videos', icon: Film, match: /^\/video\/(?!drafts)/ },
    ],
  },
  {
    label: 'Library',
    items: [
      { to: '/studios', label: 'Studios', icon: Building2 },
      { to: '/pornstars', label: 'Pornstars', icon: Users },
      { to: '/category', label: 'Categories', icon: Tags },
    ],
  },
]

export function Sidebar() {
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed)
  const onToggleCollapse = useUiStore((state) => state.toggleSidebar)
  const mobileOpen = useUiStore((state) => state.mobileNavOpen)
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen)
  const logout = useAuthStore((state) => state.signOut)
  const { pathname } = useLocation()
  const videoListHref = useVideoListHref()
  // Polls slowly here; the drafts page speeds it up while open.
  const { counts } = useDraftQueue(15000)
  const onCloseMobile = () => setMobileNavOpen(false)

  // The mobile drawer always renders expanded, whatever the desktop preference.
  const renderContent = (collapsed: boolean) => (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-ink">
      <div
        className={`flex items-center border-b border-sidebar-border ${
          collapsed ? 'justify-center px-3 py-5' : 'justify-between px-4 py-5'
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-bloom via-slate-blue to-cloudy-sky text-white shadow-sm shadow-indigo-bloom/30">
            <Clapperboard className="size-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold tracking-tight text-sidebar-ink">
                P-Tape Admin
              </p>
              <p className="truncate text-[11px] font-medium tracking-wide text-sidebar-muted uppercase">
                Admin
              </p>
            </div>
          )}
        </div>
        <button
          type="button"
          className="rounded-lg p-1.5 text-sidebar-muted transition hover:bg-sidebar-hover hover:text-sidebar-ink lg:hidden"
          onClick={onCloseMobile}
          aria-label="Close menu"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="px-3 pt-4">
        <ButtonLink
          to="/video/add"
          className="w-full"
          leftIcon={<Plus className="size-4" />}
          title={collapsed ? 'New Video' : undefined}
        >
          {collapsed ? <span className="sr-only">New Video</span> : 'New Video'}
        </ButtonLink>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pt-5 pb-3 scrollbar-thin" aria-label="Main">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            {collapsed ? (
              <div className="mx-3 mb-2 h-px bg-sidebar-border" />
            ) : (
              <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-sidebar-muted uppercase">
                {group.label}
              </p>
            )}
            {group.items.map(({ to, label, icon: Icon, match, showReadyCount }) => {
              const isActive = pathname.startsWith(to) || Boolean(match?.test(pathname))
              const readyCount = showReadyCount ? counts.ready : 0
              return (
                <NavLink
                  key={to}
                  to={to === '/video/list' ? videoListHref : to}
                  onClick={onCloseMobile}
                  title={collapsed ? label : undefined}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                    collapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-accent-500 text-white shadow-sm shadow-indigo-bloom/25'
                      : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-ink'
                  }`}
                >
                  <Icon
                    className={`size-[18px] shrink-0 ${
                      isActive ? 'text-white' : 'text-sidebar-muted group-hover:text-accent-500'
                    }`}
                  />
                  {!collapsed && <span className="flex-1 truncate">{label}</span>}
                  {readyCount > 0 && (
                    <span
                      className={`rounded-full px-1.5 text-xs font-semibold tabular-nums ${
                        isActive ? 'bg-white/20 text-white' : 'bg-accent-500 text-white'
                      } ${collapsed ? 'absolute top-1 right-1 min-w-4 text-[10px]' : 'min-w-5 text-center'}`}
                      title={`${readyCount} ready to publish`}
                    >
                      {readyCount}
                      <span className="sr-only"> ready to publish</span>
                    </span>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={logout}
          title={collapsed ? 'Logout' : undefined}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-muted transition hover:bg-danger/10 hover:text-danger ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="size-[18px]" />
          {!collapsed && <span>Logout</span>}
        </button>

        <div className={`mt-2 flex gap-2 ${collapsed ? 'flex-col' : ''}`}>
          <ThemeToggle
            compact={collapsed}
            className={`border-sidebar-border bg-transparent text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-ink ${
              collapsed ? 'w-full' : 'flex-1'
            }`}
          />
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden items-center justify-center gap-2 rounded-xl border border-sidebar-border px-3 py-2 text-xs font-medium text-sidebar-muted transition hover:bg-sidebar-hover hover:text-sidebar-ink lg:inline-flex lg:flex-1"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <>
                <ChevronLeft className="size-4" />
                Collapse
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border bg-sidebar shadow-[4px_0_24px_rgb(22_18_42/0.04)] transition-[width] duration-200 lg:block dark:shadow-none ${
          sidebarCollapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        {renderContent(sidebarCollapsed)}
      </aside>

      <div
        className={`fixed inset-0 z-40 lg:hidden ${mobileOpen ? '' : 'pointer-events-none'}`}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-overlay transition ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Close menu overlay"
          onClick={onCloseMobile}
        />
        <aside
          className={`absolute inset-y-0 left-0 w-72 border-r border-sidebar-border bg-sidebar shadow-xl transition-transform duration-200 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {renderContent(false)}
        </aside>
      </div>
    </>
  )
}

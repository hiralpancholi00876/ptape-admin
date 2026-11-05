import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Spinner } from '../ui'
import { useUiStore } from '../../stores/uiStore'

const titles: [prefix: string, title: string][] = [
  ['/video/drafts', 'Drafts'],
  ['/video/list', 'Videos'],
  ['/video/add', 'New Video'],
  ['/video/edit', 'Edit Video'],
  ['/video/details', 'Video Details'],
  ['/studios', 'Studios'],
  ['/pornstars', 'Pornstars'],
  ['/category', 'Categories'],
]

export function AdminLayout() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed)
  const { pathname } = useLocation()
  const title = titles.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? 'Admin'

  return (
    <div className="min-h-screen bg-surface-950">
      <a
        href="#main"
        className="sr-only z-[60] rounded-lg bg-accent-500 px-3 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className={`transition-[padding] duration-200 ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-64'}`}>
        <Header title={title} />
        <main id="main" tabIndex={-1} className="px-4 py-5 focus:outline-none sm:px-6 lg:px-8">
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  sidebarCollapsed: boolean
  mobileNavOpen: boolean
  // Query string of the last video list view, so "back to videos" returns to the same search and page.
  videoListSearch: string
  toggleSidebar: () => void
  setMobileNavOpen: (open: boolean) => void
  setVideoListSearch: (search: string) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileNavOpen: false,
      videoListSearch: '',
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
      setVideoListSearch: (videoListSearch) => set({ videoListSearch }),
    }),
    {
      name: 'p-tape-ui',
      // The mobile drawer always starts closed.
      partialize: ({ sidebarCollapsed, videoListSearch }) => ({ sidebarCollapsed, videoListSearch }),
    },
  ),
)

export const useVideoListHref = () => useUiStore((state) => `/video/list${state.videoListSearch}`)

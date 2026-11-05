import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Key the drafts page used before this store existed. It seeds the initial state,
// so best-video marks carry over until the store first saves.
const LEGACY_BEST_LINKS_KEY = 'draftVideosBestLinks'

function legacyBestLinks(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(LEGACY_BEST_LINKS_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((l): l is string => typeof l === 'string') : []
  } catch {
    return []
  }
}

interface DraftsState {
  // Best-marked drafts are parked in their own tab, out of the working queue.
  bestLinks: string[]
  // Publish-panel preferences.
  removeDraftAfterPublish: boolean
  openNextAfterPublish: boolean
  // Marks the links as best, or unmarks them when every one is already marked.
  toggleBest: (links: string[]) => void
  setRemoveDraftAfterPublish: (value: boolean) => void
  setOpenNextAfterPublish: (value: boolean) => void
}

export const useDraftsStore = create<DraftsState>()(
  persist(
    (set) => ({
      bestLinks: legacyBestLinks(),
      removeDraftAfterPublish: true,
      openNextAfterPublish: true,
      toggleBest: (links) =>
        set((state) => {
          const allAlreadyBest = links.length > 0 && links.every((l) => state.bestLinks.includes(l))
          return {
            bestLinks: allAlreadyBest
              ? state.bestLinks.filter((l) => !links.includes(l))
              : Array.from(new Set([...state.bestLinks, ...links])),
          }
        }),
      setRemoveDraftAfterPublish: (removeDraftAfterPublish) => set({ removeDraftAfterPublish }),
      setOpenNextAfterPublish: (openNextAfterPublish) => set({ openNextAfterPublish }),
    }),
    {
      name: 'p-tape-drafts',
      partialize: ({ bestLinks, removeDraftAfterPublish, openNextAfterPublish }) => ({
        bestLinks,
        removeDraftAfterPublish,
        openNextAfterPublish,
      }),
    },
  ),
)

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { DraftVideo, DraftVideoStatus } from '../types'
import { api, type ApiResponse } from '../lib/api'
import { draftStage, type DraftTab } from '../lib/drafts'
import { useDraftsStore } from '../stores/draftsStore'

// The drafts list merged with live upload progress, plus how many drafts sit in each tab.
// `pollMs` is how often progress refreshes; the shortest interval among mounted users wins.
export function useDraftQueue(pollMs: number) {
  const bestLinks = useDraftsStore((state) => state.bestLinks)

  const list = useQuery({
    queryKey: ['draft-videos'],
    queryFn: async () => (await api.get<ApiResponse<DraftVideo[]>>('/draft-videos')).data.data,
  })

  // Upload progress changes constantly, so it is polled separately from the full list.
  const progress = useQuery({
    queryKey: ['draft-videos-status'],
    queryFn: async () => (await api.get<ApiResponse<DraftVideoStatus[]>>('/draft-videos-status')).data.data,
    refetchInterval: pollMs,
    staleTime: 0,
  })

  const drafts = useMemo(() => {
    const updates = new Map(progress.data?.map((s) => [s.id, s]))
    return (list.data ?? []).map((draft) => {
      const update = updates.get(draft.id)
      return update ? { ...draft, ...update } : draft
    })
  }, [list.data, progress.data])

  const { byTab, counts } = useMemo(() => {
    const best = new Set(bestLinks)
    const tabs: Record<DraftTab, DraftVideo[]> = { ready: [], upload: [], progress: [], failed: [], best: [], all: [] }
    for (const draft of drafts) {
      // Best-marked drafts are parked: they only show in the Best tab.
      if (best.has(draft.link)) {
        tabs.best.push(draft)
        continue
      }
      tabs.all.push(draft)
      tabs[draftStage(draft)].push(draft)
    }
    const tabCounts = Object.fromEntries(Object.entries(tabs).map(([tab, items]) => [tab, items.length]))
    return { byTab: tabs, counts: tabCounts as Record<DraftTab, number> }
  }, [drafts, bestLinks])

  return {
    drafts,
    byTab,
    counts,
    isLoading: list.isLoading,
    isRefetching: list.isRefetching,
    refetch: list.refetch,
  }
}

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Camera, Check, ChevronLeft, ChevronRight, CircleAlert, Search } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { ImportableVideo } from '../../types'
import { api, type ApiResponse } from '../../lib/api'
import { timeAgo } from '../../lib/format'
import { Button, Modal } from '../ui'

interface VideoSelectModalProps {
  onClose: () => void
}

// Picker for importing videos from the source site into the drafts list. Mount it only while open.
export function VideoSelectModal({ onClose }: VideoSelectModalProps) {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Map<string, ImportableVideo>>(() => new Map())

  const { data: alreadyImported = new Set<string>() } = useQuery({
    queryKey: ['alreadySelectedVideos'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<string[]>>('/check-already-selected-videos')
      return new Set(data.data)
    },
    staleTime: 1000 * 60 * 5,
  })

  const {
    data: videos = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['availableVideos', page],
    queryFn: async () => {
      const { data } = await api.post<ApiResponse<ImportableVideo[]>>('/fetch-fuckingsession', { page })
      return data.success ? data.data : []
    },
    placeholderData: (prev) => prev,
  })

  const submitMutation = useMutation({
    mutationFn: (list: ImportableVideo[]) => api.post('/save-to-upload-draft', list),
    onSuccess: () => {
      toast.success('Videos added to drafts')
      queryClient.invalidateQueries({ queryKey: ['draft-videos'] })
      queryClient.invalidateQueries({ queryKey: ['alreadySelectedVideos'] })
      onClose()
    },
    onError: () => toast.error('Failed to add videos'),
  })

  const toggleSelection = (video: ImportableVideo) => {
    const next = new Map(selected)
    if (next.has(video.link)) next.delete(video.link)
    else next.set(video.link, video)
    setSelected(next)
  }

  const handleSubmit = () => {
    submitMutation.mutate([...selected.values()].filter((v) => !alreadyImported.has(v.link)))
  }

  const openScreenshot = async (link: string) => {
    try {
      const { data } = await api.post<ApiResponse<{ screenshotLink: string | null } | undefined>>(
        '/fetch-fuckingsession-screenshot',
        { link },
      )
      if (data.success && data.data?.screenshotLink) {
        window.open(data.data.screenshotLink, '_blank', 'noopener')
      } else {
        toast('No screenshot available')
      }
    } catch {
      toast.error('Failed to fetch screenshot')
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title="Select videos"
      description="Browse and select videos to import as drafts"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="font-medium text-zinc-100">{selected.size}</span> selected
            {selected.size > 0 && (
              <button
                type="button"
                onClick={() => setSelected(new Map())}
                className="text-xs text-danger hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-surface-700 p-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
                aria-label="Previous page"
                className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-hover hover:text-zinc-100 disabled:opacity-30"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="min-w-8 text-center text-sm font-medium text-zinc-200">{page}</span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={isFetching}
                aria-label="Next page"
                className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-hover hover:text-zinc-100 disabled:opacity-30"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={selected.size === 0} loading={submitMutation.isPending}>
              Add ({selected.size})
            </Button>
          </div>
        </div>
      }
    >
      <div className="relative min-h-72">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-surface-700 bg-surface-900 p-2">
                <div className="aspect-video rounded-lg bg-surface-750" />
                <div className="mt-2 h-4 w-3/4 rounded bg-surface-750" />
                <div className="mt-2 h-3 w-1/2 rounded bg-surface-750" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CircleAlert className="mb-3 size-10 text-danger" />
            <h3 className="font-semibold text-zinc-100">Failed to load videos</h3>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
              Try again
            </Button>
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="mb-3 size-10 text-zinc-500" />
            <p className="text-sm text-zinc-500">No videos found on this page.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {videos.map((video) => {
              const isSelected = selected.has(video.link)
              const isImported = alreadyImported.has(video.link)

              return (
                <div
                  key={video.link}
                  className={`group relative overflow-hidden rounded-xl border-2 bg-surface-900 transition ${
                    isImported
                      ? 'border-transparent opacity-50 grayscale'
                      : isSelected
                        ? 'border-accent-500 shadow-lg'
                        : 'border-transparent hover:border-accent-500/40'
                  }`}
                >
                  <button
                    type="button"
                    disabled={isImported}
                    onClick={() => toggleSelection(video)}
                    aria-pressed={isSelected}
                    className="block w-full text-left disabled:cursor-not-allowed"
                  >
                    <div className="relative aspect-video bg-surface-800">
                      <img src={video.thumbnail} alt="" loading="lazy" className="size-full object-cover" />
                      {isSelected && (
                        <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-accent-500 text-white">
                          <Check className="size-4" />
                        </span>
                      )}
                      {isImported && (
                        <span className="absolute inset-0 flex items-center justify-center bg-surface-950/60">
                          <span className="rounded bg-black/80 px-2 py-1 text-xs text-white">Imported</span>
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <h3 className="line-clamp-2 text-sm font-medium text-zinc-100">{video.title}</h3>
                      <div className="mt-1.5 flex items-center justify-between text-xs text-zinc-500">
                        <span>{timeAgo(video.datetime)}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                            video.status ? 'bg-success/10 text-success' : 'bg-surface-750 text-zinc-500'
                          }`}
                        >
                          {video.status || 'New'}
                        </span>
                      </div>
                    </div>
                  </button>
                  {!isImported && (
                    <button
                      type="button"
                      onClick={() => openScreenshot(video.link)}
                      className="absolute top-2 left-2 rounded-lg bg-black/50 p-1.5 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/70 focus-visible:opacity-100"
                      title="View screenshot"
                      aria-label="View screenshot"
                    >
                      <Camera className="size-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {isFetching && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-850/50">
            <span className="size-8 animate-spin rounded-full border-2 border-accent-500 border-r-transparent" />
          </div>
        )}
      </div>
    </Modal>
  )
}

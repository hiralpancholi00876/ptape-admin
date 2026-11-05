import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowDown, CloudUpload, Plus, RefreshCw, Sparkles, Star, Trash2, Video as VideoIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { DraftVideo } from '../../types'
import { api, errorMessage, type ApiResponse } from '../../lib/api'
import { canUpload, DRAFT_TABS, isDraftTab, type DraftTab } from '../../lib/drafts'
import { useDraftQueue } from '../../hooks/useDraftQueue'
import { confirm } from '../../stores/confirmStore'
import { useDraftsStore } from '../../stores/draftsStore'
import { DraftCard } from '../../components/drafts/DraftCard'
import { PublishDraftDrawer } from '../../components/drafts/PublishDraftDrawer'
import { VideoSelectModal } from '../../components/video/VideoSelectModal'
import { Button, EmptyState, Tabs } from '../../components/ui'

const EMPTY_STATES: Record<DraftTab, { title: string; description: string }> = {
  ready: {
    title: 'Nothing Ready to Publish',
    description: 'Drafts land here once they’re parsed and uploaded.',
  },
  upload: { title: 'Nothing Waiting to Upload', description: 'Parsed drafts that still need their video file show up here.' },
  progress: { title: 'Nothing in Progress', description: 'Drafts being parsed or uploaded show up here with live progress.' },
  failed: { title: 'No Failures', description: 'Drafts whose parse or upload failed show up here to retry.' },
  best: { title: 'No Best Videos', description: 'Select drafts and choose Mark Best to park them here for later.' },
  all: { title: 'No Drafts Yet', description: 'Import videos to start filling the publishing queue.' },
}

const reparseDraft = async (id: number) => {
  const { data } = await api.post<ApiResponse<unknown>>('/reparse-draft', { id })
  if (!data.success) {
    throw new Error(data.message || 'Failed to start AI parse')
  }
}
const deleteDraft = (link: string) => api.post('/delete-draft-video', { link })
const queueUpload = (draft: DraftVideo) => api.post('/add-to-remote-upload', { link: draft.link, id: draft.id })

export function Drafts() {
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const tabParam = params.get('tab')
  const tab: DraftTab = isDraftTab(tabParam) ? tabParam : 'ready'
  const { drafts, byTab, counts, isLoading, isRefetching, refetch } = useDraftQueue(2000)
  const bestLinks = useDraftsStore((state) => state.bestLinks)
  const toggleBest = useDraftsStore((state) => state.toggleBest)
  const openNextAfterPublish = useDraftsStore((state) => state.openNextAfterPublish)
  const [selectedLinks, setSelectedLinks] = useState<string[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [publishing, setPublishing] = useState<DraftVideo | null>(null)
  // Drafts saved as videos this session; they stay listed when "remove draft" is off.
  const [publishedIds, setPublishedIds] = useState<number[]>([])
  const [reparsingIds, setReparsingIds] = useState<number[]>([])
  const [showScrollButton, setShowScrollButton] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const visible = byTab[tab]
  const bestSet = new Set(bestLinks)
  const selectedDrafts = drafts.filter((d) => selectedLinks.includes(d.link))
  const uploadable = selectedDrafts.filter(canUpload)
  const reparsable = selectedDrafts.filter((d) => d.status === 'done' || d.status === 'failed')
  const allSelectedBest = selectedLinks.length > 0 && selectedLinks.every((l) => bestSet.has(l))
  const allVisibleSelected = visible.length > 0 && visible.every((d) => selectedLinks.includes(d.link))
  const readyQueue = byTab.ready.filter((d) => !publishedIds.includes(d.id))

  useEffect(() => {
    const onScroll = () =>
      setShowScrollButton(window.scrollY + window.innerHeight < document.body.offsetHeight - 200)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const refreshQueue = () => {
    queryClient.invalidateQueries({ queryKey: ['draft-videos'] })
    queryClient.invalidateQueries({ queryKey: ['draft-videos-status'] })
  }

  const changeTab = (next: DraftTab) => {
    setParams(next === 'ready' ? {} : { tab: next }, { replace: true })
    setSelectedLinks([])
  }

  const toggleSelect = (link: string) =>
    setSelectedLinks((prev) => (prev.includes(link) ? prev.filter((l) => l !== link) : [...prev, link]))

  const handlePublished = (draft: DraftVideo) => {
    const published = [...publishedIds, draft.id]
    setPublishedIds(published)
    const next = openNextAfterPublish ? byTab.ready.find((d) => !published.includes(d.id)) : undefined
    setPublishing(next ?? null)
    if (openNextAfterPublish && !next) toast.success('That was the last ready draft')
  }

  // Re-parsing overwrites the draft's metadata, so it asks first.
  const reparse = (draft: DraftVideo) =>
    confirm({
      title: 'Re-parse with AI?',
      message: `Run the AI parse again for “${draft.title || 'Untitled draft'}”? Its current title, pornstars, studios and description are replaced.`,
      confirmLabel: 'Re-parse',
      tone: 'primary',
      onConfirm: async () => {
        setReparsingIds((ids) => [...ids, draft.id])
        try {
          await reparseDraft(draft.id)
          // The parsed metadata is about to change, so a cached publish form would be stale.
          queryClient.removeQueries({ queryKey: ['draft-video', draft.id] })
          toast.success('AI parse started')
          refreshQueue()
        } catch (error) {
          toast.error(errorMessage(error, 'Failed to start AI parse'))
        } finally {
          setReparsingIds((ids) => ids.filter((id) => id !== draft.id))
        }
      },
    })

  const upload = async (draft: DraftVideo) => {
    try {
      await queueUpload(draft)
      toast.success('Upload queued')
      refreshQueue()
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to queue the upload'))
    }
  }

  // Confirm, run with the dialog's spinner showing, then refresh the queue.
  const confirmBulk = (
    options: { title: string; message: string; confirmLabel: string; tone?: 'danger' | 'primary' },
    action: () => Promise<unknown>,
    successMessage: string,
  ) =>
    confirm({
      ...options,
      onConfirm: async () => {
        try {
          await action()
          toast.success(successMessage)
          setSelectedLinks([])
        } catch (error) {
          toast.error(errorMessage(error, 'Some drafts couldn’t be updated. Refresh and try again.'))
        } finally {
          refreshQueue()
        }
      },
    })

  const handleDelete = (draft: DraftVideo) =>
    confirmBulk(
      {
        title: 'Delete Draft?',
        message: `Delete “${draft.title || 'Untitled draft'}”? Its uploaded file is kept.`,
        confirmLabel: 'Delete Draft',
      },
      () => deleteDraft(draft.link),
      'Draft deleted',
    )

  const handleBulkDelete = () =>
    confirmBulk(
      {
        title: `Delete ${selectedLinks.length} Drafts?`,
        message: `Delete ${selectedLinks.length} selected drafts? Their uploaded files are kept.`,
        confirmLabel: 'Delete Drafts',
      },
      () => Promise.all(selectedLinks.map(deleteDraft)),
      `${selectedLinks.length} drafts deleted`,
    )

  const handleBulkUpload = () =>
    confirmBulk(
      {
        title: `Upload ${uploadable.length} Videos?`,
        message: `Queue ${uploadable.length} selected drafts for upload?`,
        confirmLabel: 'Start Uploads',
        tone: 'primary',
      },
      () => Promise.all(uploadable.map(queueUpload)),
      `${uploadable.length} uploads queued`,
    )

  const handleBulkReparse = () =>
    confirmBulk(
      {
        title: `Re-parse ${reparsable.length} Drafts?`,
        message: `Run the AI parse again for ${reparsable.length} selected drafts? Their current metadata is replaced.`,
        confirmLabel: 'Re-parse',
        tone: 'primary',
      },
      async () => {
        await Promise.all(reparsable.map((d) => reparseDraft(d.id)))
        queryClient.removeQueries({ queryKey: ['draft-video'] })
      },
      'AI parse started',
    )

  const empty = EMPTY_STATES[tab]

  return (
    <div className="space-y-5 pb-10">
      <div className="sticky top-20 z-20 space-y-3 rounded-2xl border border-surface-700 bg-surface-850/95 p-3 shadow-panel backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs
            label="Draft stage"
            value={tab}
            onChange={changeTab}
            options={DRAFT_TABS.map((t) => ({ ...t, count: counts[t.value] }))}
            className="max-w-full"
          />
          <div className="ml-auto flex gap-2">
            <Button
              variant="secondary"
              onClick={() => refetch()}
              title="Refresh drafts"
              aria-label="Refresh drafts"
              className="px-3"
            >
              <RefreshCw className={`size-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={() => setPickerOpen(true)} leftIcon={<Plus className="size-4" />}>
              Import Videos
            </Button>
          </div>
        </div>

        {visible.length > 0 && (
          <div className="flex min-h-8 flex-wrap items-center gap-2 border-t border-surface-700 pt-3">
            <label className="mr-2 flex cursor-pointer items-center gap-2 text-sm text-zinc-400 select-none hover:text-zinc-200">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                ref={(el) => {
                  if (el) el.indeterminate = selectedLinks.length > 0 && !allVisibleSelected
                }}
                onChange={() => setSelectedLinks(allVisibleSelected ? [] : visible.map((d) => d.link))}
                className="size-4 rounded"
              />
              {selectedLinks.length > 0 ? (
                <span className="font-medium text-zinc-100">{selectedLinks.length} selected</span>
              ) : (
                `Select all ${visible.length}`
              )}
            </label>
            {selectedLinks.length > 0 && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    toggleBest(selectedLinks)
                    setSelectedLinks([])
                  }}
                  leftIcon={<Star className={`size-3.5 ${allSelectedBest ? 'fill-current' : ''}`} />}
                >
                  {allSelectedBest ? 'Unmark Best' : 'Mark Best'}
                </Button>
                {reparsable.length > 0 && (
                  <Button size="sm" variant="outline" onClick={handleBulkReparse} leftIcon={<Sparkles className="size-3.5" />}>
                    Re-parse ({reparsable.length})
                  </Button>
                )}
                {uploadable.length > 0 && (
                  <Button size="sm" variant="outline" onClick={handleBulkUpload} leftIcon={<CloudUpload className="size-3.5" />}>
                    Upload ({uploadable.length})
                  </Button>
                )}
                <Button size="sm" variant="danger" onClick={handleBulkDelete} leftIcon={<Trash2 className="size-3.5" />}>
                  Delete ({selectedLinks.length})
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedLinks([])}>
                  Clear
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-surface-700 bg-surface-850 p-3">
              <div className="aspect-video rounded-xl bg-surface-750" />
              <div className="mt-3 h-4 w-3/4 rounded bg-surface-750" />
              <div className="mt-3 h-5 w-1/2 rounded-full bg-surface-750" />
              <div className="mt-3 h-10 rounded-xl bg-surface-750" />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={VideoIcon}
          title={empty.title}
          description={
            tab === 'ready' && counts.progress > 0
              ? `${counts.progress} ${counts.progress === 1 ? 'draft is' : 'drafts are'} still parsing or uploading.`
              : empty.description
          }
          action={
            tab === 'ready' && counts.upload > 0 ? (
              <Button variant="outline" onClick={() => changeTab('upload')}>
                View {counts.upload} To Upload
              </Button>
            ) : tab === 'all' ? (
              <Button onClick={() => setPickerOpen(true)} leftIcon={<Plus className="size-4" />}>
                Import Videos
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {visible.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              selected={selectedLinks.includes(draft.link)}
              isBest={bestSet.has(draft.link)}
              published={publishedIds.includes(draft.id)}
              reparsePending={reparsingIds.includes(draft.id)}
              onToggleSelect={() => toggleSelect(draft.link)}
              onPublish={() => setPublishing(draft)}
              onUpload={() => upload(draft)}
              onReparse={() => reparse(draft)}
              onToggleBest={() => toggleBest([draft.link])}
              onDelete={() => handleDelete(draft)}
            />
          ))}
        </div>
      )}

      {publishing && (
        <PublishDraftDrawer
          draft={publishing}
          remaining={readyQueue.filter((d) => d.id !== publishing.id).length}
          onClose={() => setPublishing(null)}
          onPublished={handlePublished}
        />
      )}

      {pickerOpen && (
        <VideoSelectModal
          onClose={() => {
            setPickerOpen(false)
            window.setTimeout(() => refetch(), 500)
          }}
        />
      )}

      {showScrollButton && !publishing && (
        <button
          type="button"
          onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="fixed right-6 bottom-6 z-30 flex size-11 items-center justify-center rounded-full bg-accent-500 text-white shadow-lg shadow-indigo-bloom/30 transition-colors hover:bg-accent-600"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="size-5" />
        </button>
      )}
      <div ref={bottomRef} />
    </div>
  )
}

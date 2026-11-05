import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { DraftPrefill, DraftVideo, VideoFormValues } from '../../types'
import { api, errorMessage, type ApiResponse } from '../../lib/api'
import { draftStage } from '../../lib/drafts'
import { NO_THUMBNAIL_IMAGE } from '../../lib/format'
import { newVideoFormValues, videoPayload } from '../../lib/video'
import { confirm } from '../../stores/confirmStore'
import { useDraftsStore } from '../../stores/draftsStore'
import { VideoForm } from '../video/VideoForm'
import { Button, Drawer, Spinner } from '../ui'

interface PublishDraftDrawerProps {
  draft: DraftVideo
  // Ready drafts still waiting after this one.
  remaining: number
  onClose: () => void
  // Called once the video is saved; the page decides whether to open the next draft.
  onPublished: (draft: DraftVideo) => void
}

export function PublishDraftDrawer({ draft, remaining, onClose, onPublished }: PublishDraftDrawerProps) {
  const queryClient = useQueryClient()
  const [dirty, setDirty] = useState(false)
  const removeDraft = useDraftsStore((state) => state.removeDraftAfterPublish)
  const openNext = useDraftsStore((state) => state.openNextAfterPublish)
  const setRemoveDraft = useDraftsStore((state) => state.setRemoveDraftAfterPublish)
  const setOpenNext = useDraftsStore((state) => state.setOpenNextAfterPublish)

  const { data: defaultValues, isPending, isError, refetch } = useQuery({
    queryKey: ['draft-video', draft.id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DraftVideo>>(`/draft-videos/${draft.id}`)
      const detail = data.data
      const prefill: DraftPrefill = {
        ...detail.scrap_data,
        thumbnail: detail.thumbnail?.trim() || NO_THUMBNAIL_IMAGE,
        video_sources: [
          {
            url: detail.s3_key,
            file_size: detail.s3_file_size,
            file_type: detail.webhook_data?.type || 'mp4',
            server: detail.webhook_data?.server,
          },
        ],
      }
      return newVideoFormValues(prefill)
    },
    // Built once per draft: a background refetch must not swap the form's defaults mid-edit.
    staleTime: Infinity,
  })

  const requestClose = () => {
    if (!dirty) return onClose()
    confirm({
      title: 'Discard Unsaved Changes?',
      message: 'Your edits to this draft haven’t been saved yet.',
      confirmLabel: 'Discard Changes',
      onConfirm: onClose,
    })
  }

  const onSubmit = async (values: VideoFormValues) => {
    try {
      const { data } = await api.post<ApiResponse<unknown>>('/add-video', videoPayload(values))
      if (!data.success) {
        throw new Error(data.message || 'Failed to add video')
      }
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to publish video'))
      return false
    }

    toast.success(values.is_active ? `Published “${values.title}”` : `Saved “${values.title}” as hidden`)
    if (removeDraft) {
      try {
        await api.post('/delete-draft-video', { link: draft.link })
      } catch {
        toast.error('The video was saved, but its draft couldn’t be removed. Delete it from the list.')
      }
    }
    queryClient.invalidateQueries({ queryKey: ['draft-videos'] })
    queryClient.invalidateQueries({ queryKey: ['videos'] })
    queryClient.invalidateQueries({ queryKey: ['select-options'] })
    return true
  }

  const uploaded = draftStage(draft) === 'ready'

  return (
    <Drawer
      open
      onClose={requestClose}
      title="Publish Draft"
      description={
        <span className="flex flex-wrap gap-x-2">
          <span className="truncate">{draft.title || 'Untitled draft'}</span>
          {remaining > 0 && <span className="text-zinc-600">· {remaining} more ready</span>}
        </span>
      }
    >
      {isPending ? (
        <Spinner label="Loading draft…" />
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-zinc-400">Couldn’t load this draft. Check your connection and try again.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      ) : (
        <>
          {!uploaded && (
            <div className="mx-5 mt-5 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-sm text-warning">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              The upload hasn’t finished, so there’s no video file yet. Add a source manually, or close this and
              publish once the upload completes.
            </div>
          )}
          <VideoForm
            key={draft.id}
            mode="create"
            variant="panel"
            defaultValues={defaultValues}
            onSubmit={onSubmit}
            onSaved={() => onPublished(draft)}
            onDirtyChange={setDirty}
            guardNavigation
            footerStart={
              <>
                <Checkbox checked={removeDraft} onChange={setRemoveDraft} label="Remove draft after saving" />
                <Checkbox checked={openNext} onChange={setOpenNext} label="Open next ready draft" />
              </>
            }
          />
        </>
      )}
    </Drawer>
  )
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400 select-none hover:text-zinc-200">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-surface-600"
      />
      {label}
    </label>
  )
}

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { DraftVideo } from '../../types'
import { api, errorMessage, type ApiResponse } from '../../lib/api'
import { Button, FieldLabel, Input, Modal } from '../ui'

const DOWNLOAD_SOURCES = [
  { value: 'auto', label: 'auto' },
  { value: 'iceyfile', label: 'iceyfile.com' },
  { value: 'mixdrop', label: 'mixdrop' },
  { value: 'streamtape', label: 'streamtape' },
  { value: 'direct', label: 'user direct' },
] as const

type DownloadSource = (typeof DOWNLOAD_SOURCES)[number]['value']

function isHttpUrl(value: string) {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

interface UploadConfirmModalProps {
  drafts: DraftVideo[]
  onClose: () => void
  onQueued: () => void
}

export function UploadConfirmModal({ drafts, onClose, onQueued }: UploadConfirmModalProps) {
  const queryClient = useQueryClient()
  const [source, setSource] = useState<DownloadSource>('auto')
  const [urls, setUrls] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(false)
  const single = drafts.length === 1
  const isDirect = source === 'direct'
  const canSubmit = !isDirect || drafts.every((draft) => isHttpUrl(urls[draft.id] ?? ''))

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await Promise.all(
        drafts.map(async (draft) => {
          const { data } = await api.post<ApiResponse<unknown>>('/add-to-remote-upload', {
            id: draft.id,
            link: draft.link,
            downloadSource: source,
            sourceUrl: isDirect ? urls[draft.id]?.trim() : undefined,
          })
          if (!data.success) {
            throw new Error(data.message || 'Failed to queue the upload')
          }
        }),
      )
      toast.success(single ? 'Upload queued' : `${drafts.length} uploads queued`)
      onQueued()
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to queue the upload'))
    } finally {
      setLoading(false)
      queryClient.invalidateQueries({ queryKey: ['draft-videos'] })
      queryClient.invalidateQueries({ queryKey: ['draft-videos-status'] })
    }
  }

  return (
    <Modal
      open
      onClose={loading ? () => {} : onClose}
      title={single ? 'Upload this video?' : `Upload ${drafts.length} Videos?`}
      description={
        single
          ? `Queue “${drafts[0].title || 'Untitled draft'}” for upload?`
          : `Queue ${drafts.length} selected drafts for upload?`
      }
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} disabled={!canSubmit}>
            {single ? 'Start Upload' : 'Start Uploads'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="relative">
          <FieldLabel htmlFor="download-source">Video download source</FieldLabel>
          <select
            id="download-source"
            value={source}
            onChange={(e) => setSource(e.target.value as DownloadSource)}
            disabled={loading}
            className="h-11 w-full appearance-none rounded-xl border border-surface-700 bg-surface-950 pr-9 pl-3.5 text-sm text-zinc-100 transition focus:border-accent-500 focus:bg-surface-900 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            {DOWNLOAD_SOURCES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-0 bottom-0 flex h-11 w-9 items-center justify-center text-zinc-500">
            <ChevronDown className="size-4 shrink-0" aria-hidden />
          </span>
        </div>

        {isDirect && (
          <div className="space-y-3">
            {drafts.map((draft) => (
              <Input
                key={draft.id}
                label={draft.title || 'Untitled draft'}
                type="url"
                inputMode="url"
                placeholder="https://"
                value={urls[draft.id] ?? ''}
                disabled={loading}
                onChange={(e) => setUrls((prev) => ({ ...prev, [draft.id]: e.target.value }))}
              />
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

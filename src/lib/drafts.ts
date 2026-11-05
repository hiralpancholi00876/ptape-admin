import type { DraftVideo, UploadStatus } from '../types'

// Where a draft sits on the way to becoming a published video.
export type DraftStage = 'ready' | 'upload' | 'progress' | 'failed'

const UPLOADING: UploadStatus[] = ['queued', 'downloading', 'ffmpeg', 'uploading']

export function draftStage(draft: DraftVideo): DraftStage {
  if (draft.status === 'failed' || draft.upload_status === 'failed') return 'failed'
  // Anything not yet parsed is still in the AI queue.
  if (draft.status !== 'done') return 'progress'
  if (draft.upload_status === 'completed') return 'ready'
  if (UPLOADING.includes(draft.upload_status)) return 'progress'
  return 'upload'
}

export const canUpload = (draft: DraftVideo) =>
  (draft.status === 'done' && draft.upload_status === 'not_started') ||
  draft.upload_status === 'stopped' ||
  draft.upload_status === 'failed'

export type DraftTab = DraftStage | 'best' | 'all'

export const DRAFT_TABS: { value: DraftTab; label: string }[] = [
  { value: 'ready', label: 'Ready to Publish' },
  { value: 'upload', label: 'To Upload' },
  { value: 'progress', label: 'In Progress' },
  { value: 'failed', label: 'Failed' },
  { value: 'best', label: 'Best' },
  { value: 'all', label: 'All' },
]

export const isDraftTab = (value: string | null): value is DraftTab =>
  DRAFT_TABS.some((tab) => tab.value === value)

const UPLOAD_LABELS: Record<UploadStatus, string> = {
  not_started: 'Not uploaded',
  queued: 'Queued',
  downloading: 'Downloading',
  ffmpeg: 'Processing',
  uploading: 'Uploading',
  completed: 'Uploaded',
  failed: 'Upload failed',
  stopped: 'Upload stopped',
}

export const uploadLabel = (status: UploadStatus) => UPLOAD_LABELS[status] ?? status

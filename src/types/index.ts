export interface Option {
  value: string
  label: string
}

// A row from GET /videos.
export interface VideoListItem {
  video_id: number
  title: string
  thumbnail: string
  slug: string
  duration: number
  views: number
  upload_date: string
  studios: string[]
  pstars: string[]
  is_active: number
}

export interface VideoListPage {
  videos: VideoListItem[]
  pagination: {
    currentPage: number
    totalPages: number
    total?: number
  }
}

// A tbl_video_urls row as returned by GET /getvideo.
export interface VideoSource {
  id?: number
  video_embed_id?: string
  url: string | null
  quality: string | null
  file_size: number | null
  file_type: string | null
  // Optional extras the UI shows when the API provides them.
  is_active?: number
  server_name?: string
}

export interface VideoDetails {
  video_id: number
  title: string
  description: string | null
  upload_date: string
  duration: number
  thumbnail: string
  slug: string
  is_active: number
  views: number
  external_id: string | null
  studios: string[]
  pornstars: string[]
  categories: string[]
  videoSources: VideoSource[]
}

// Shape of the add/edit video form. `id` on sources only keys the rows in the UI.
export interface VideoFormSource {
  id: string
  file_size: number | null
  file_type: string | null
  quality: string | null
  url: string
}

export interface VideoFormValues {
  title: string
  description: string
  datetime: string
  duration: string
  studios: Option[]
  pornstars: Option[]
  categories: Option[]
  thumbnail: string
  is_active: boolean
  videoSources: VideoFormSource[]
}

export interface Studio {
  studio_id: number
  name: string
  website: string | null
  video_count: number
  total_views: number
  slug: string
  is_active: number
}

export interface Pornstar {
  pstar_id: number
  name: string
  video_count: number
  total_views: number
  slug: string
  is_active: number
}

export interface Category {
  category_id: number
  name: string
  video_count: number
  slug: string
  is_active: number
}

export type UploadStatus =
  | 'not_started'
  | 'queued'
  | 'downloading'
  | 'ffmpeg'
  | 'uploading'
  | 'completed'
  | 'failed'
  | 'stopped'

export interface DraftVideo {
  id: number
  title: string
  thumbnail: string
  link: string
  datetime?: string
  status?: string
  // AI-formatted metadata (title, studios, pornstars, meta fields, ...).
  scrap_data: Record<string, unknown> | null
  upload_status: UploadStatus
  upload_progress?: number
  webhook_data: { type?: string; server?: string } | null
  job_id?: string
  s3_key: string | null
  s3_file_size: number | null
}

export interface DraftVideoStatus {
  id: number
  status: string
  upload_status: UploadStatus
  upload_progress: number
}

// A video offered by the import source in the drafts "Add Video" picker.
export interface ImportableVideo {
  title: string
  link: string
  thumbnail: string
  datetime?: string
  status?: string
}

// A draft's AI-parsed metadata plus its uploaded file, used to prefill the publish form.
export interface DraftPrefill {
  title?: string
  description?: string
  meta_description?: string
  datetime?: string
  duration?: string
  thumbnail?: string
  studios?: string[]
  pornstars?: string[]
  video_sources?: {
    url: string | null
    file_size: number | null
    file_type?: string
    server?: string
  }[]
}

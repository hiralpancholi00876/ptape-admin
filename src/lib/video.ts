import type { DraftPrefill, VideoDetails, VideoFormSource, VideoFormValues } from '../types'
import { formatDuration, newId, NO_THUMBNAIL_IMAGE, toLocal, toOptions, toUTC } from './format'

const VIDEO_CDN = {
  smoothpre: 'https://smoothpre-cdn.hyper-flash.workers.dev/',
  default: 'https://video-cdn.rapid-access.online/',
}

// Scraped dates come in assorted formats; anything unreadable starts at now.
function draftDatetime(value?: string) {
  const date = value ? new Date(value) : new Date()
  return toLocal(Number.isNaN(date.getTime()) ? new Date() : date)
}

export function emptySource(): VideoFormSource {
  return { id: newId(), file_size: null, file_type: 'mp4', quality: '720p', url: '' }
}

// Blank add form, or one prefilled from a draft's parsed metadata and uploaded file.
export function newVideoFormValues(draft: DraftPrefill | null): VideoFormValues {
  const description = draft?.description?.trim() ? draft.description : draft?.meta_description
  // Only sources that finished uploading have a file to point at.
  const uploaded = draft?.video_sources?.filter((source) => source.url) ?? []

  return {
    title: draft?.title ?? '',
    description: description ?? '',
    // Most videos go out now, so start there instead of an empty required field.
    datetime: draftDatetime(draft?.datetime),
    duration: draft?.duration ?? '00:00:00',
    studios: toOptions(draft?.studios),
    pornstars: toOptions(draft?.pornstars),
    categories: [],
    thumbnail: draft?.thumbnail?.trim() || NO_THUMBNAIL_IMAGE,
    is_active: false,
    videoSources: uploaded.length
      ? uploaded.map((source) => ({
          id: newId(),
          file_size: source.file_size || null,
          file_type: source.file_type || 'mp4',
          quality: '720p',
          url: (source.server === 'smoothpre' ? VIDEO_CDN.smoothpre : VIDEO_CDN.default) + source.url,
        }))
      : [emptySource()],
  }
}

export function videoFormValues(video: VideoDetails): VideoFormValues {
  return {
    title: video.title,
    description: video.description ?? '',
    datetime: toLocal(video.upload_date),
    duration: formatDuration(video.duration),
    studios: toOptions(video.studios),
    pornstars: toOptions(video.pornstars),
    categories: toOptions(video.categories),
    thumbnail: video.thumbnail,
    is_active: video.is_active === 1,
    videoSources: video.videoSources.map((source) => ({
      id: newId(),
      file_size: source.file_size || null,
      // The API requires both; default to what the selects show.
      file_type: source.file_type || 'mp4',
      quality: source.quality || '720p',
      url: source.url ? source.url.split('?')[0] : '',
    })),
  }
}

// Fields shared by POST /add-video and POST /edit-video.
export function videoPayload(values: VideoFormValues) {
  return {
    title: values.title,
    description: values.description || null,
    upload_datetime: toUTC(values.datetime),
    duration: values.duration,
    studios: values.studios.map((studio) => studio.label),
    pornstars: values.pornstars.map((pornstar) => pornstar.label),
    categories: values.categories.map((category) => category.label),
    thumbnail: values.thumbnail,
    is_active: values.is_active ? 1 : 0,
    videoSources: values.videoSources
      .filter((source) => source.url.trim())
      .map(({ file_size, file_type, quality, url }) => ({ file_size, file_type, quality, url: url.trim() })),
  }
}

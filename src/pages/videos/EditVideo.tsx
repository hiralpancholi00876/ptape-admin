import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Copy, ExternalLink, FileWarning, MonitorPlay } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { VideoDetails, VideoFormValues } from '../../types'
import { api, errorMessage, type ApiResponse } from '../../lib/api'
import { videoFormValues, videoPayload } from '../../lib/video'
import { useVideoListHref } from '../../stores/uiStore'
import { VideoForm } from '../../components/video/VideoForm'
import { ButtonLink, EmptyState, Spinner } from '../../components/ui'

export function EditVideo() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const listHref = useVideoListHref()

  const { data: video, isPending, isError } = useQuery({
    queryKey: ['video', slug],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<VideoDetails>>('/getvideo', { params: { slug } })
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch video details')
      }
      return data.data
    },
  })

  if (isPending) return <Spinner label="Loading video…" />

  if (isError) {
    return (
      <EmptyState
        icon={FileWarning}
        title="Couldn’t Load This Video"
        description="It may have been deleted, or the server is unreachable. Go back and try again."
        action={
          <ButtonLink to={listHref} variant="outline">
            Back to Videos
          </ButtonLink>
        }
      />
    )
  }

  const onSubmit = async (values: VideoFormValues) => {
    try {
      const { data } = await api.post<ApiResponse<unknown>>('/edit-video', {
        slug,
        ...videoPayload(values),
        external_id: video.external_id,
      })
      if (!data.success) {
        throw new Error(data.message)
      }
      queryClient.invalidateQueries({ queryKey: ['video', slug] })
      queryClient.invalidateQueries({ queryKey: ['videos'] })
      queryClient.invalidateQueries({ queryKey: ['select-options'] })
      toast.success('Changes saved')
      return true
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to update video'))
      return false
    }
  }

  const copySlug = async () => {
    try {
      await navigator.clipboard.writeText(slug)
      toast.success('Slug copied')
    } catch {
      toast.error('Could not copy the slug. Select it and copy manually.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <ButtonLink to={listHref} variant="ghost" size="sm" leftIcon={<ArrowLeft className="size-4" />}>
          Back to Videos
        </ButtonLink>
        <span className="mx-1 hidden h-5 w-px bg-surface-700 sm:block" />
        <button
          type="button"
          onClick={copySlug}
          title="Copy slug"
          className="flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 font-mono text-xs text-zinc-400 transition hover:bg-hover hover:text-zinc-100"
        >
          <span className="truncate" translate="no">
            {slug}
          </span>
          <Copy className="size-3.5 shrink-0" />
        </button>
        <div className="ml-auto flex gap-2">
          <ButtonLink
            to={`/video/details/${slug}`}
            variant="outline"
            size="sm"
            leftIcon={<MonitorPlay className="size-4" />}
          >
            Preview
          </ButtonLink>
          <ButtonLink
            href={`https://porntape.net/video/${slug}`}
            variant="outline"
            size="sm"
            leftIcon={<ExternalLink className="size-4" />}
          >
            View on Site
          </ButtonLink>
        </div>
      </div>
      <VideoForm
        // Fresh form state when navigating straight from one video's edit page to another's.
        key={video.video_id}
        mode="edit"
        defaultValues={videoFormValues(video)}
        onSubmit={onSubmit}
        onSaved={() => navigate(listHref)}
        guardNavigation
      />
    </div>
  )
}

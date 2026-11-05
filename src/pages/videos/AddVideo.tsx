import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { VideoFormValues } from '../../types'
import { api, errorMessage, type ApiResponse } from '../../lib/api'
import { newVideoFormValues, videoPayload } from '../../lib/video'
import { useVideoListHref } from '../../stores/uiStore'
import { VideoForm } from '../../components/video/VideoForm'
import { ButtonLink } from '../../components/ui'

export function AddVideo() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const listHref = useVideoListHref()
  const [defaultValues] = useState(() => newVideoFormValues(null))

  const onSubmit = async (values: VideoFormValues) => {
    try {
      const { data } = await api.post<ApiResponse<unknown>>('/add-video', videoPayload(values))
      if (!data.success) {
        throw new Error(data.message || 'Failed to add video')
      }
      toast.success(values.is_active ? 'Video published' : 'Video saved as hidden')
      queryClient.invalidateQueries({ queryKey: ['videos'] })
      queryClient.invalidateQueries({ queryKey: ['select-options'] })
      return true
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to add video'))
      return false
    }
  }

  return (
    <div className="space-y-4">
      <ButtonLink to={listHref} variant="ghost" size="sm" leftIcon={<ArrowLeft className="size-4" />}>
        Back to Videos
      </ButtonLink>
      <VideoForm
        mode="create"
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        onSaved={() => navigate(listHref)}
        guardNavigation
      />
    </div>
  )
}

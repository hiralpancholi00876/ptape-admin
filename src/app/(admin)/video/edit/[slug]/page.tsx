'use client';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard'; // Keeping import but might not use directly if restyling
import VideoDetailsInputs from '@/components/video/VideoDetailsInputs';
import StudioSelect from '@/components/video/StudioSelect';
import PornstarSelect from '@/components/video/PornstarSelect';
import PosterFetch from '@/components/video/PosterFetch';
import VideoSourceManager from '@/components/video/VideoSourceManager';
import { useForm, Controller } from 'react-hook-form';
import React, { useState } from 'react';
import axios from '@/utils/axios';
import { formatDuration, toLocal, toUTC } from '@/utils/commonFunc';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import ToggleSwitch from '@/components/form/switch/Switch';
import CategoryDetails from '@/components/video/CategoryDetails';
import { Save, ArrowLeft, Edit, Loader2, AlertCircle, Copy, ExternalLink } from 'lucide-react';

interface VideoFormData {
  title: string;
  description: string;
  datetime: string;
  duration: string;
  studios: { value: string; label: string }[];
  pornstars: { value: string; label: string }[];
  categories: { value: string; label: string }[];
  thumbnail:
    | string
    | 'https://diplo-media.s3.eu-central-1.amazonaws.com/2023/06/default-video-thumbnail.jpg';
  is_active: boolean;
  videoSources: {
    id: string;
    file_size: number | null;
    file_type: string | null;
    quality: string | null;
    url: string;
  }[];
}

export default function EditVideoPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [slug, setSlug] = useState<string | null>(null);
  const [external_id, setExternalId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VideoFormData>({});

  React.useEffect(() => {
    params.then(async (resolvedParams) => {
      setSlug(resolvedParams.slug);
      try {
        const response = await axios.get(`/getvideo?slug=${resolvedParams.slug}`);

        if (response.data.success) {
          const videoData = response.data.data;
          setValue('title', videoData.title);
          setValue('description', videoData.description);
          setValue('datetime', toLocal(videoData.upload_date));
          setValue('duration', formatDuration(videoData.duration));
          setValue(
            'studios',
            videoData.studios.map((studio: string, index: number) => ({
              value: studio + index,
              label: studio,
            }))
          );
          setValue(
            'pornstars',
            videoData.pornstars.map((star: string, index: number) => ({
              value: star + index,
              label: star,
            }))
          );
          setValue(
            'categories',
            videoData.categories.map((category: string, index: number) => ({
              value: category + index,
              label: category,
            }))
          );
          setValue('thumbnail', videoData.thumbnail);
          setValue('is_active', videoData.is_active === 1);
          setExternalId(videoData.external_id || null);
          setValue(
            'videoSources',
            videoData.videoSources.map((source: any) => ({
              id:
                source.video_embed_id ||
                Date.now().toString() + Math.random().toString(36).substring(2, 9),
              file_size: source.file_size || null,
              file_type: source.file_type || null,
              quality: source.quality || null,
              url: source.url ? source.url.split('?')[0] : '',
            }))
          );
        } else {
          throw new Error(response.data.message || 'Failed to fetch video details');
        }
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: 'Failed to fetch video details',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } finally {
        setIsLoading(false);
      }
    });
  }, [params, setValue]);

  const onSubmit = async (data: VideoFormData) => {
    setIsSaving(true);
    const payload = {
      slug: slug,
      title: data.title,
      description: data.description,
      upload_datetime: toUTC(data.datetime),
      duration: data.duration,
      studios: data.studios.map((studio) => studio.label),
      pornstars: data.pornstars.map((star) => star.label),
      categories: data.categories.map((category) => category.label),
      thumbnail: data.thumbnail,
      external_id: external_id,
      is_active: data.is_active ? 1 : 0,
      videoSources:
        data.videoSources.map((source) => ({
          file_size: source.file_size,
          file_type: source.file_type,
          quality: source.quality,
          url: source.url,
        })) || [],
    };

    try {
      const response = await axios.post(`/edit-video`, payload);
      if (response.data.success) {
        Swal.fire({
          title: 'Updated!',
          text: 'Video details updated successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          router.push('/video/list');
        });
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Failed to update video',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="animate-pulse text-gray-500">Loading video details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 pb-20 dark:bg-gray-900/50">
      <div className="mx-auto max-w-[1920px] space-y-6">
        {/* Header Actions */}
        <div className="bg-opacity-95 dark:bg-opacity-95 sticky top-0 z-10 flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm backdrop-blur-xl md:flex-row md:items-center dark:border-gray-700/50 dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/video/list')}
              className="group rounded-xl bg-gray-100 p-2.5 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 transition-transform group-hover:-translate-x-1 dark:text-gray-300" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className="max-w-md truncate text-xl font-bold text-gray-900 dark:text-white"
                  title={slug || ''}
                >
                  Edit: <span className="font-medium text-blue-600">{slug}</span>
                </h1>
                <button
                  onClick={() => {
                    if (slug) {
                      navigator.clipboard.writeText(slug);
                      Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: 'Slug copied',
                        showConfirmButton: false,
                        timer: 1000,
                      });
                    }
                  }}
                  className="p-1.5 text-gray-400 transition-colors hover:text-blue-500"
                  title="Copy Slug"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-gray-500">Update video metadata and sources</p>
            </div>
          </div>

          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving}
            className="flex min-w-[160px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3 font-medium text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:bg-blue-700 hover:shadow-blue-600/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="animate-in fade-in duration-500">
          <div className="space-y-6">
            {/* Main Content Info & Sidebar Content Merged */}

            {/* Detailed Inputs */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
                <div className="h-5 w-1 rounded-full bg-blue-500" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Metadata & Basic Info
                </h3>
              </div>
              <div className="p-6">
                <VideoDetailsInputs control={control} errors={errors} />
                <div className="mt-8 border-t border-gray-100 pt-6 dark:border-gray-700">
                  <Controller
                    name="is_active"
                    control={control}
                    render={({ field }) => (
                      <div className="flex flex-row items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
                        <div>
                          <span className="text-base font-semibold text-gray-900 dark:text-white">
                            Active Status
                          </span>
                          <p className="mt-1 text-sm text-gray-500">
                            Currently:{' '}
                            <span
                              className={
                                field.value ? 'font-bold text-green-600' : 'font-bold text-gray-500'
                              }
                            >
                              {field.value ? 'Published' : 'Draft/Hidden'}
                            </span>
                          </p>
                        </div>
                        <ToggleSwitch label="" checked={field.value} onChange={field.onChange} />
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Taxonomy Cluster */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Studios</h3>
                <div className="flex-1">
                  <StudioSelect control={control} />
                </div>
              </div>
              <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">
                  Cast / Pornstars
                </h3>
                <div className="flex-1">
                  <PornstarSelect control={control} errors={errors} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Categories</h3>
              <CategoryDetails control={control} errors={errors} />
            </div>

            {/* Poster Fetch moved inline */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 font-medium dark:border-gray-700 dark:bg-gray-800/50">
                Thumbnail
              </div>
              <div className="p-6">
                <PosterFetch control={control} errors={errors} watch={watch} />
              </div>
            </div>
          </div>
          {/* Sources */}
          <div className="mt-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4 font-medium dark:border-gray-700 dark:bg-gray-800/50">
              <span>Video Sources</span>
              <span className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-500 dark:bg-gray-700">
                Manage Stream Links
              </span>
            </div>
            <div className="p-6">
              <VideoSourceManager control={control} name="videoSources" />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

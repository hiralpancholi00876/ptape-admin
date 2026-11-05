'use client';
import VideoDetailsInputs from '@/components/video/VideoDetailsInputs';
import TaxonomySelect from '@/components/video/TaxonomySelect';
import PosterFetch from '@/components/video/PosterFetch';
import VideoSourceManager from '@/components/video/VideoSourceManager';
import { useForm, Controller } from 'react-hook-form';
import React, { use, useEffect, useState } from 'react';
import axios from '@/utils/axios';
import { formatDuration, toLocal, toUTC, toOptions } from '@/utils/commonFunc';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import ToggleSwitch from '@/components/form/switch/Switch';
import { Save, ArrowLeft, LoaderCircle, Copy } from 'lucide-react';

type Option = { value: string; label: string };

interface VideoFormData {
  title: string;
  description: string;
  datetime: string;
  duration: string;
  studios: Option[];
  pornstars: Option[];
  categories: Option[];
  thumbnail: string;
  is_active: boolean;
  videoSources: {
    id: string;
    file_size: number | null;
    file_type: string | null;
    quality: string | null;
    url: string;
  }[];
}

// A tbl_video_urls row as returned by /getvideo.
interface ApiVideoSource {
  video_embed_id?: string;
  file_size: number | null;
  file_type: string | null;
  quality: string | null;
  url: string | null;
}

export default function EditVideoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [externalId, setExternalId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VideoFormData>();

  useEffect(() => {
    axios
      .get('/getvideo', { params: { slug } })
      .then((response) => {
        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to fetch video details');
        }

        const video = response.data.data;
        setValue('title', video.title);
        setValue('description', video.description);
        setValue('datetime', toLocal(video.upload_date));
        setValue('duration', formatDuration(video.duration));
        setValue('studios', toOptions(video.studios));
        setValue('pornstars', toOptions(video.pornstars));
        setValue('categories', toOptions(video.categories));
        setValue('thumbnail', video.thumbnail);
        setValue('is_active', video.is_active === 1);
        setValue(
          'videoSources',
          video.videoSources.map((source: ApiVideoSource) => ({
            id:
              source.video_embed_id ||
              Date.now().toString() + Math.random().toString(36).substring(2, 9),
            file_size: source.file_size || null,
            file_type: source.file_type || null,
            quality: source.quality || null,
            url: source.url ? source.url.split('?')[0] : '',
          }))
        );
        setExternalId(video.external_id || null);
      })
      .catch(() => {
        Swal.fire({
          title: 'Error',
          text: 'Failed to fetch video details',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      })
      .finally(() => setIsLoading(false));
  }, [slug, setValue]);

  const onSubmit = async (data: VideoFormData) => {
    try {
      const response = await axios.post('/edit-video', {
        slug,
        title: data.title,
        description: data.description,
        upload_datetime: toUTC(data.datetime),
        duration: data.duration,
        studios: data.studios.map((studio) => studio.label),
        pornstars: data.pornstars.map((star) => star.label),
        categories: data.categories.map((category) => category.label),
        thumbnail: data.thumbnail,
        external_id: externalId,
        is_active: data.is_active ? 1 : 0,
        videoSources: data.videoSources.map(({ file_size, file_type, quality, url }) => ({
          file_size,
          file_type,
          quality,
          url,
        })),
      });
      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      await Swal.fire({
        title: 'Updated!',
        text: 'Video details updated successfully.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
      router.push('/video/list');
    } catch {
      Swal.fire({
        title: 'Error',
        text: 'Failed to update video',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  };

  const copySlug = () => {
    navigator.clipboard.writeText(slug);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Slug copied',
      showConfirmButton: false,
      timer: 1000,
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="h-10 w-10 animate-spin text-blue-600" />
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
                  title={slug}
                >
                  Edit: <span className="font-medium text-blue-600">{slug}</span>
                </h1>
                <button
                  onClick={copySlug}
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
            disabled={isSubmitting}
            className="flex min-w-[160px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3 font-medium text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:bg-blue-700 hover:shadow-blue-600/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="animate-in fade-in duration-500">
          <div className="space-y-6">
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
                        <ToggleSwitch checked={field.value} onChange={field.onChange} />
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
                  <TaxonomySelect name="studios" control={control} />
                </div>
              </div>
              <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">
                  Cast / Pornstars
                </h3>
                <div className="flex-1">
                  <TaxonomySelect
                    name="pornstars"
                    control={control}
                    errors={errors}
                    requiredMessage="Pornstars is required"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Categories</h3>
              <TaxonomySelect
                name="categories"
                control={control}
                errors={errors}
                requiredMessage="Category is required"
              />
            </div>

            {/* Thumbnail */}
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

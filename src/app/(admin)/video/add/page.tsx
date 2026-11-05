'use client';
import Swal from 'sweetalert2';
import { useForm, Controller } from 'react-hook-form';
import VideoSourceManager from '@/components/video/VideoSourceManager';
import VideoDetailsInputs from '@/components/video/VideoDetailsInputs';
import TaxonomySelect from '@/components/video/TaxonomySelect';
import PosterFetch from '@/components/video/PosterFetch';
import React, { useEffect } from 'react';
import axios from '@/utils/axios';
import { useRouter } from 'next/navigation';
import { toUTC, toOptions, NO_THUMBNAIL_IMAGE } from '@/utils/commonFunc';
import ToggleSwitch from '@/components/form/switch/Switch';
import { Save, Film, ArrowLeft } from 'lucide-react';

type Option = { value: string; label: string };

interface VideoFormData {
  title: string;
  description: string | null;
  datetime: string;
  duration: string;
  studios: Option[];
  pornstars: Option[];
  categories: Option[];
  thumbnail: string;
  is_active: boolean;
  videoSources: {
    id: string | null;
    file_size: number | null;
    file_type: string | null;
    quality: string | null;
    url: string;
  }[];
}

// Shape the drafts page writes to localStorage when "Add" is clicked on a draft.
interface DraftVideo {
  title?: string;
  description?: string;
  meta_description?: string;
  datetime?: string;
  duration?: string;
  thumbnail?: string;
  studios?: string[];
  pornstars?: string[];
  video_sources?: { url: string; file_size: number | null; file_type?: string; server?: string }[];
}

const VIDEO_CDN = {
  smoothpre: 'https://smoothpre-cdn.hyper-flash.workers.dev/',
  default: 'https://video-cdn.rapid-access.online/',
};

export default function AddVideo() {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<VideoFormData>({
    defaultValues: {
      title: '',
      description: '',
      datetime: '',
      duration: '00:00:00',
      studios: [],
      pornstars: [],
      categories: [],
      thumbnail: NO_THUMBNAIL_IMAGE,
      is_active: false,
      videoSources: [{ id: null, file_size: null, file_type: 'mp4', quality: '720p', url: '' }],
    },
  });

  // Prefill from a draft handed over by the drafts page.
  useEffect(() => {
    const storedData = localStorage.getItem('selectedVideo');
    if (storedData) {
      try {
        const draft: DraftVideo = JSON.parse(storedData);
        const description = draft.description?.trim() ? draft.description : draft.meta_description;

        if (draft.title) setValue('title', draft.title);
        if (description) setValue('description', description);
        if (draft.datetime) setValue('datetime', draft.datetime);
        if (draft.duration) setValue('duration', draft.duration);
        setValue('thumbnail', draft.thumbnail?.trim() || NO_THUMBNAIL_IMAGE);
        if (draft.studios) setValue('studios', toOptions(draft.studios));
        if (draft.pornstars) setValue('pornstars', toOptions(draft.pornstars));
        if (draft.video_sources) {
          setValue(
            'videoSources',
            draft.video_sources.map((source) => ({
              id: null,
              file_size: source.file_size || null,
              file_type: source.file_type || 'mp4',
              quality: '720p',
              url:
                (source.server === 'smoothpre' ? VIDEO_CDN.smoothpre : VIDEO_CDN.default) +
                source.url,
            }))
          );
        }
      } catch (e) {
        console.error('Error parsing local storage video data', e);
      }
    }

    // Drop the draft after this visit. The timeout skips React's dev remount,
    // which runs this cleanup once before the form has finished loading.
    let committed = false;
    const timer = window.setTimeout(() => {
      committed = true;
    }, 0);

    return () => {
      window.clearTimeout(timer);
      if (committed) {
        localStorage.removeItem('selectedVideo');
      }
    };
  }, [setValue]);

  const onSubmit = async (data: VideoFormData) => {
    try {
      const response = await axios.post('/add-video', {
        title: data.title,
        description: data.description || null,
        upload_datetime: toUTC(data.datetime),
        duration: data.duration,
        studios: data.studios.map((studio) => studio.label),
        pornstars: data.pornstars.map((pornstar) => pornstar.label),
        categories: data.categories.map((category) => category.label),
        thumbnail: data.thumbnail,
        is_active: data.is_active ? 1 : 0,
        videoSources: (data.videoSources || []).map(({ file_size, file_type, quality, url }) => ({
          file_size,
          file_type,
          quality,
          url,
        })),
      });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to add video');
      }

      await Swal.fire({
        title: 'Success',
        text: 'Video added successfully!',
        icon: 'success',
        confirmButtonColor: '#2563eb',
        timer: 2000,
      });
      router.push('/video/list');
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: (error instanceof Error && error.message) || 'Failed to add video',
        icon: 'error',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 pb-20 dark:bg-gray-900/50">
      <div className="mx-auto max-w-[1920px] space-y-6">
        {/* Header Section */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:flex-row md:items-center dark:border-gray-700/50 dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/video/list')}
              className="rounded-xl bg-gray-100 p-2 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
              title="Go Back"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="flex items-center gap-2 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-2xl font-bold text-transparent dark:from-white dark:to-gray-400">
                <Film className="h-7 w-7 text-blue-600" />
                Add New Video
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create a new video entry by filling out the form
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 font-medium text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:bg-blue-700 hover:shadow-blue-600/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              <span>Save Video</span>
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            {/* Left Column - Main Details */}
            <div className="space-y-6 xl:col-span-8">
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Metadata & Basic Info
                  </h3>
                </div>
                <div className="p-6">
                  <VideoDetailsInputs control={control} errors={errors} />

                  <div className="mt-6 border-t border-gray-100 pt-6 dark:border-gray-700">
                    <Controller
                      name="is_active"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4 dark:bg-gray-900/50">
                          <div>
                            <span className="block font-medium text-gray-900 dark:text-white">
                              Publication Status
                            </span>
                            <span className="text-sm text-gray-500">
                              Enable to make this video publicly visible
                            </span>
                          </div>
                          <ToggleSwitch checked={field.value} onChange={field.onChange} />
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Categorization Section - Grouped */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                    Studio Information
                  </h3>
                  <TaxonomySelect name="studios" control={control} />
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                    Cast / Pornstars
                  </h3>
                  <TaxonomySelect
                    name="pornstars"
                    control={control}
                    errors={errors}
                    requiredMessage="Pornstars is required"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                  Categories & Tags
                </h3>
                <TaxonomySelect
                  name="categories"
                  control={control}
                  errors={errors}
                  requiredMessage="Category is required"
                />
              </div>
            </div>

            {/* Right Column - Media */}
            <div className="space-y-6 xl:col-span-4">
              {/* Poster / Thumbnail */}
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="border-b border-gray-100 p-4 font-medium dark:border-gray-700">
                  Poster / Thumbnail
                </div>
                <div className="p-6">
                  <PosterFetch control={control} errors={errors} watch={watch} />
                </div>
              </div>
            </div>
          </div>

          {/* Video Sources */}
          <div className="mt-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-100 p-4 font-medium dark:border-gray-700">
              Video Sources
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

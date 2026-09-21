'use client';
import Swal from 'sweetalert2';
import { useForm, Controller } from 'react-hook-form';
import ComponentCard from '@/components/common/ComponentCard';
import VideoSourceManager from '@/components/video/VideoSourceManager';
import VideoDetailsInputs from '@/components/video/VideoDetailsInputs';
import StudioSelect from '@/components/video/StudioSelect';
import PornstarSelect from '@/components/video/PornstarSelect';
import PosterFetch from '@/components/video/PosterFetch';
import ScrapDetails from '@/components/video/ScrapDetails';
import React, { useEffect, useState } from 'react';
import axios from '@/utils/axios';
import { useRouter } from 'next/navigation';
import { toUTC } from '@/utils/commonFunc';
import ToggleSwitch from '@/components/form/switch/Switch';
import CategoryDetails from '@/components/video/CategoryDetails';
import { Save, Film, Wand2, ArrowLeft } from 'lucide-react';

// Define the form data interface
interface VideoFormData {
  // Video Details
  title: string;
  description: string | null;

  datetime: string;
  duration: string;

  // studios Details
  studios: { value: string; label: string }[];

  // Pornstar Details
  pornstars: { value: string; label: string }[];

  // category Details
  categories: { value: string; label: string }[];

  // Poster Details
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

export default function AddVideo() {
  const router = useRouter();
  const [isScraping, setIsScraping] = useState(false);

  // Set up react-hook-form
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
      thumbnail:
        'https://diplo-media.s3.eu-central-1.amazonaws.com/2023/06/default-video-thumbnail.jpg',
      is_active: false,
      videoSources: [
        {
          id: null,
          file_size: null,
          file_type: 'mp4',
          quality: '720p',
          url: '',
        },
      ],
    },
  });

  // Handle LocalStorage Draft Data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('selectedVideo');
      if (storedData) {
        try {
          const draftVideoData = JSON.parse(storedData);

          if (draftVideoData.title) setValue('title', draftVideoData.title);
          if (draftVideoData.description || draftVideoData.meta_description) {
            setValue(
              'description',
              draftVideoData.description && draftVideoData.description.trim() !== ''
                ? draftVideoData.description
                : draftVideoData.meta_description
            );
          }

          if (draftVideoData.datetime) setValue('datetime', draftVideoData.datetime);
          if (draftVideoData.duration) setValue('duration', draftVideoData.duration);

          if (draftVideoData.studios) {
            const studios = draftVideoData.studios.map((studio: string) => ({
              value: studio,
              label: studio,
            }));
            setValue('studios', studios);
          }
          if (draftVideoData.pornstars) {
            const pornstars = draftVideoData.pornstars.map((pornstar: string) => ({
              value: pornstar,
              label: pornstar,
            }));
            setValue('pornstars', pornstars);
          }

          if (draftVideoData.video_sources) {
            setValue(
              'videoSources',
              draftVideoData.video_sources.map((source: any) => ({
                id: null,
                file_size: source.file_size || null,
                file_type: source.file_type || 'mp4',
                quality: '720p',
                url:
                  source.server == 'smoothpre'
                    ? 'https://smoothpre-cdn.hyper-flash.workers.dev/' + source.url
                    : 'https://video-cdn.rapid-access.online/' + source.url,
              }))
            );
          }

          // localStorage.removeItem('selectedVideo'); // Optional: Clear after retrieving
        } catch (e) {
          console.error('Error parsing local storage video data', e);
        }
      }
    }
  }, [setValue]);

  const onSubmit = async (data: VideoFormData) => {
    let sendData = {
      title: data.title,
      description: data.description || null,
      upload_datetime: toUTC(data.datetime),
      duration: data.duration,
      studios: data.studios.map((studio) => studio.label),
      pornstars: data.pornstars.map((pornstar) => pornstar.label),
      categories: data.categories.map((category) => category.label),
      thumbnail: data.thumbnail,
      is_active: data.is_active ? 1 : 0,
      videoSources:
        data.videoSources?.map((source) => ({
          file_size: source.file_size,
          file_type: source.file_type,
          quality: source.quality,
          url: source.url,
        })) || [],
    };

    try {
      const response = await axios.post('/add-video', sendData);
      if (response.data.success) {
        Swal.fire({
          title: 'Success',
          text: 'Video added successfully!',
          icon: 'success',
          confirmButtonColor: '#2563eb',
          timer: 2000,
        }).then(() => {
          router.push('/video/list');
        });
      } else {
        throw new Error(response.data.message || 'Failed to add video');
      }
    } catch (error: any) {
      Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to add video',
        icon: 'error',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  // Handler for scraped video data
  const handleScrapedData = (data: any) => {
    if (data) {
      setIsScraping(true);
      // Simulate a small delay for better UX feeling of "populating"
      setTimeout(() => {
        if (data.title) setValue('title', data.title);
        if (data.description) setValue('description', data.description);
        if (data.thumbnail) setValue('thumbnail', data.thumbnail);
        if (data.duration) setValue('duration', data.duration);
        if (data.datetime) setValue('datetime', data.datetime);

        if (data.studios && Array.isArray(data.studios)) {
          setValue(
            'studios',
            data.studios.map((studio: any) => ({ value: studio, label: studio }))
          );
        }

        if (data.pornstars && Array.isArray(data.pornstars)) {
          setValue(
            'pornstars',
            data.pornstars.map((pornstar: any) => ({ value: pornstar, label: pornstar }))
          );
        }

        if (data.categories && Array.isArray(data.categories)) {
          setValue(
            'categories',
            data.categories.map((category: any) => ({ value: category, label: category }))
          );
        }

        if (data.videoSources && Array.isArray(data.videoSources)) {
          setValue('videoSources', data.videoSources);
        }

        setIsScraping(false);
        Swal.fire({
          title: 'Imported!',
          text: 'Video details have been imported successfully.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          position: 'top-end',
          toast: true,
        });
      }, 500);
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
                Create a new video entry by filling out the form or scraping data
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
                          <ToggleSwitch label="" checked={field.value} onChange={field.onChange} />
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
                  <StudioSelect control={control} />
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                    Cast / Pornstars
                  </h3>
                  <PornstarSelect control={control} errors={errors} />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                  Categories & Tags
                </h3>
                <CategoryDetails control={control} errors={errors} />
              </div>
            </div>

            {/* Right Column - Media & Tools */}
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
              {/* Scrap Tool */}
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 p-6 shadow-sm dark:border-indigo-900/30 dark:from-indigo-900/10 dark:to-blue-900/10">
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                    <Wand2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Auto-Import Data</h3>
                    <p className="text-xs text-gray-500">Fetch details from external URL</p>
                  </div>
                </div>
                <ScrapDetails onDataReceived={handleScrapedData} />
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

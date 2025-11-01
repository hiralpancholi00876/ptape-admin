'use client';
import Swal from 'sweetalert2';
import { useForm, Controller } from "react-hook-form";
import ComponentCard from "@/components/common/ComponentCard";
import VideoSourceManager from "@/components/video/VideoSourceManager";
import VideoDetailsInputs from "@/components/video/VideoDetailsInputs";
import StudioSelect from "@/components/video/StudioSelect";
import PornstarSelect from "@/components/video/PornstarSelect";
import TagsSelect from "@/components/video/TagsSelect";
import PosterFetch from "@/components/video/PosterFetch";
import ScrapDetails from "@/components/video/ScrapDetails";
import JsonInput from "@/components/video/JsonInput";
import React from "react";
import axios from "@/utils/axios";
import { useRouter } from "next/navigation";
import { toUTC } from "@/utils/commonFunc";
import ToggleSwitch from "@/components/form/switch/Switch";

// Define the form data interface
interface VideoFormData {
  // Video Details
  title: string;
  description: string | null;
  // Video Metadata
  meta_title: string;
  meta_description: string;

  datetime: string;
  duration: string;

  // studios Details
  studios: { value: string; label: string }[];

  // Pornstar Details
  pornstars: { value: string; label: string }[];

  // Tags Details
  tags: { value: string; label: string }[];

  // Poster Details
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


export default function AddVideo() {
  const router = useRouter();
  let draftVideoData: any = null;
  if (typeof window !== 'undefined') {
    const storedData = localStorage.getItem('selectedVideo');
    if (storedData) {
      draftVideoData = JSON.parse(storedData);
      localStorage.removeItem('selectedVideo'); // Clear after retrieving
    }
  }

  // Set up react-hook-form
  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<VideoFormData>({
    defaultValues: {
      title: draftVideoData?.title || '',
      description: '',
      meta_title: draftVideoData?.meta_title || '',
      meta_description: draftVideoData?.meta_description || '',
      datetime: draftVideoData?.datetime,
      duration: draftVideoData?.duration || '00:00:00',
      studios: draftVideoData?.studios ? draftVideoData.studios.map((studio: string) => ({ value: studio, label: studio })) : [],
      pornstars: draftVideoData?.pornstars ? draftVideoData.pornstars.map((pornstar: string) => ({ value: pornstar, label: pornstar })) : [],
      tags: [],
      thumbnail: 'https://diplo-media.s3.eu-central-1.amazonaws.com/2023/06/default-video-thumbnail.jpg',
      is_active: false,
    }
  });

  const onSubmit = (data: VideoFormData) => {

    let sendData = {
      title: data.title,
      description: data.description || null,
      meta_title: data.meta_title || null,
      meta_description: data.meta_description || null,
      upload_datetime: toUTC(data.datetime),
      duration: data.duration,
      studios: data.studios.map(studio => studio.label),
      pornstars: data.pornstars.map(pornstar => pornstar.label),
      tags: data.tags.map(tag => tag.label),
      thumbnail: data.thumbnail,
      is_active: data.is_active ? 1 : 0,
      videoSources: data.videoSources?.map(source => ({
        file_size: source.file_size,
        file_type: source.file_type,
        quality: source.quality,
        url: source.url
      })) || []
    }

    axios.post('/add-video', sendData).then(response => {
      if (response.data.success) {
        Swal.fire({
          title: 'Success',
          text: 'Video added successfully!',
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
          router.push("/video/list");
        });
      } else {
        Swal.fire({
          title: 'Error',
          text: response.data.message || 'Failed to add video',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    }).catch(error => {
      Swal.fire({
        title: 'Error',
        text: 'Failed to add video',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    });
  };

  // Handler for scraped video data
  const handleScrapedData = (data: any) => {
    if (data) {
      // Populate form fields with scraped data
      if (data.title) setValue('title', data.title);
      if (data.description) setValue('description', data.description);
      if (data.thumbnail) setValue('thumbnail', data.thumbnail);
      if (data.duration) setValue('duration', data.duration);
      if (data.datetime) setValue('datetime', data.datetime);
      if (data.meta_title) setValue('meta_title', data.meta_title);
      if (data.meta_description) setValue('meta_description', data.meta_description);

      // Handle studios if available
      if (data.studios && Array.isArray(data.studios)) {
        const studioOptions = data.studios.map((studio: any) => ({
          value: studio,
          label: studio
        }));
        setValue('studios', studioOptions);
      }

      // Handle pornstars if available
      if (data.pornstars && Array.isArray(data.pornstars)) {
        const pornstarOptions = data.pornstars.map((pornstar: any) => ({
          value: pornstar,
          label: pornstar
        }));
        setValue('pornstars', pornstarOptions);
      }

      // Handle tags if available
      if (data.tags && Array.isArray(data.tags)) {
        const tagOptions = data.tags.map((tag: any) => ({
          value: tag,
          label: tag
        }));
        setValue('tags', tagOptions);
      }

      // Handle video sources if available
      if (data.videoSources && Array.isArray(data.videoSources)) {
        setValue('videoSources', data.videoSources);
      }

      // Show success message
      Swal.fire({
        title: 'Success',
        text: 'Video details have been fetched and populated!',
        icon: 'success',
        confirmButtonText: 'OK'
      });
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <ComponentCard title="Video Details">
              <VideoDetailsInputs control={control} errors={errors} />
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <ToggleSwitch
                    label="Is Active"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </ComponentCard>

            <ComponentCard title="Studio Details">
              <StudioSelect control={control} />
            </ComponentCard>

            <ComponentCard title="Pornstar Details">
              <PornstarSelect control={control} errors={errors} />
            </ComponentCard>

            <ComponentCard title="Tags Details">
              <TagsSelect control={control} errors={errors} />
            </ComponentCard>
          </div>

          <div className="space-y-6">
            <ComponentCard title="Poster Details">
              <PosterFetch control={control} errors={errors} watch={watch} />
            </ComponentCard>

            <ComponentCard title="Video Sources">
              <VideoSourceManager
                control={control}
                name="videoSources"
              />
            </ComponentCard>

            <ComponentCard title="Fetch Video Details">
              <ScrapDetails onDataReceived={handleScrapedData} />
            </ComponentCard>
            <ComponentCard title="Json Input">
              <JsonInput onDataReceived={handleScrapedData} />
            </ComponentCard>
          </div>
        </div>
        <button
          type="submit"
          className="ml-2 bg-blue-600 text-white px-4 mt-3 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
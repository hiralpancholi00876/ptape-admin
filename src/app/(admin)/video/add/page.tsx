'use client';
import Swal from 'sweetalert2';
import { useForm } from "react-hook-form";
import ComponentCard from "@/components/common/ComponentCard";
import VideoSourceManager from "@/components/video/VideoSourceManager";
import VideoDetailsInputs from "@/components/video/VideoDetailsInputs";
import StudioSelect from "@/components/video/StudioSelect";
import PornstarSelect from "@/components/video/PornstarSelect";
import TagsSelect from "@/components/video/TagsSelect";
import PosterFetch from "@/components/video/PosterFetch";
import ScrapDetails from "@/components/video/ScrapDetails";
import React, { useState } from "react";
import axios from "@/utils/axios";
import { formatToYMDHMS } from "@/utils/commonFunc";
import { useRouter } from "next/navigation";

// Define the form data interface
interface VideoFormData {
  // Video Details
  title: string;
  description: string;
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

  videoSources: {
    id: string;
    file_size: number | null;
    file_type: string | null;
    quality: string | null;
    url: string;
  }[];
}


export default function AddVideo() {
  // Set up react-hook-form
  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<VideoFormData>({
    defaultValues: {
      title: '',
      description: '',
      datetime: '',
      duration: '',
      studios: [],
      pornstars: [],
      tags: [],
      thumbnail: 'https://diplo-media.s3.eu-central-1.amazonaws.com/2023/06/default-video-thumbnail.jpg',
    }
  });
  const router = useRouter();
  const onSubmit = (data: VideoFormData) => {

    let sendData = {
      title: data.title,
      description: data.description,
      upload_datetime: formatToYMDHMS(data.datetime),
      duration: data.duration,
      studios: data.studios.map(studio => studio.value),
      pornstars: data.pornstars.map(pornstar => pornstar.value),
      tags: data.tags.map(tag => tag.value),
      thumbnail: data.thumbnail,
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
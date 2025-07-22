'use client';
import Swal from 'sweetalert2';
import { useForm } from "react-hook-form";
import ComponentCard from "@/components/common/ComponentCard";
import VideoSourceManager from "@/components/ui/video/VideoSourceManager";
import VideoDetailsInputs from "@/components/ui/video/VideoDetailsInputs";
import StudioSelect from "@/components/ui/video/StudioSelect";
import PornstarSelect from "@/components/ui/video/PornstarSelect";
import TagsSelect from "@/components/ui/video/TagsSelect";
import PosterFetch from "@/components/ui/video/PosterFetch";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
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

  const [fetchUrl, setFetchUrl] = useState('');
  const [selectedServer, setSelectedServer] = useState('');
  const fetchDetails = async () => {
    console.log("Fetching details for URL:", fetchUrl, "on server:", selectedServer);
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
              <div>
                <Label>Videos</Label>
                <Input
                  type="text"
                  placeholder="Enter url"
                  defaultValue={fetchUrl}
                  onChange={(e) => setFetchUrl(e.target.value)}
                />
                <Label className="mt-3">Select Website</Label>
                <select className="w-full border rounded p-2" onChange={(e) => setSelectedServer(e.target.value)} value={selectedServer}>
                  <option value="">Select Server</option>
                  <option value="server1">Server 1</option>
                  <option value="server2">Server 2</option>
                  <option value="server3">Server 3</option>
                </select>
                <button
                  type="button"
                  onClick={() => fetchDetails()}
                  className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Fetch Details
                </button>
              </div>
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
'use client';
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import VideoDetailsInputs from "@/components/video/VideoDetailsInputs";
import StudioSelect from "@/components/video/StudioSelect";
import PornstarSelect from "@/components/video/PornstarSelect";
import PosterFetch from "@/components/video/PosterFetch";
import VideoSourceManager from "@/components/video/VideoSourceManager";
import { useForm, Controller } from "react-hook-form";
import React from "react";
import axios from "@/utils/axios";
import { formatDuration, toLocal, toUTC } from "@/utils/commonFunc";
import Swal from 'sweetalert2';
import { useRouter } from "next/navigation";
import ToggleSwitch from "@/components/form/switch/Switch";
import CategoryDetails from "@/components/video/CategoryDetails";

interface VideoFormData {
    title: string;
    description: string;
    meta_title: string;
    meta_description: string;
    datetime: string;
    duration: string;
    studios: { value: string; label: string }[];
    pornstars: { value: string; label: string }[];
    categories: { value: string; label: string }[];
    thumbnail: string | 'https://diplo-media.s3.eu-central-1.amazonaws.com/2023/06/default-video-thumbnail.jpg';
    is_active: boolean;
    videoSources: {
        id: string;
        file_size: number | null;
        file_type: string | null;
        quality: string | null;
        url: string;
    }[];
}

export default function EditVideoPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const router = useRouter();
    const [slug, setSlug] = React.useState<string | null>(null);
    const [external_id, setExternalId] = React.useState<string | null>(null);

    React.useEffect(() => {
        params.then(async (resolvedParams) => {
            setSlug(resolvedParams.slug);
            try {
                const response = await axios.get(`/getvideo?slug=${resolvedParams.slug}`);

                if (response.data.success) {
                    const videoData = response.data.data;
                    setValue("title", videoData.title);
                    setValue("description", videoData.description);
                    setValue("meta_title", videoData.meta_title || '');
                    setValue("meta_description", videoData.meta_description || '');
                    setValue("datetime", toLocal(videoData.upload_date));
                    setValue("duration", formatDuration(videoData.duration));
                    setValue("studios", videoData.studios.map((studio: string, index: number) => ({ value: studio + index, label: studio })));
                    setValue("pornstars", videoData.pornstars.map((star: string, index: number) => ({ value: star + index, label: star })));
                    setValue("categories", videoData.categories.map((category: string, index: number) => ({ value: category + index, label: category })));
                    setValue("thumbnail", videoData.thumbnail);
                    setValue("is_active", videoData.is_active === 1);
                    setExternalId(videoData.external_id || null);
                    setValue("videoSources", videoData.videoSources.map((source: any) => ({
                        id: source.video_embed_id || Date.now().toString() + Math.random().toString(36).substring(2, 9),
                        file_size: source.file_size || null,
                        file_type: source.file_type || null,
                        quality: source.quality || null,
                        url: source.url || ""
                    })));
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: response.data.message || 'Failed to fetch video details',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            } catch (error) {
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to fetch video details',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        });
    }, [params]);

    const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<VideoFormData>({});

    const onSubmit = async (data: VideoFormData) => {

        const payload = {
            slug: slug,
            title: data.title,
            description: data.description,
            meta_title: data.meta_title || null,
            meta_description: data.meta_description || null,
            upload_datetime: toUTC(data.datetime),
            duration: data.duration,
            studios: data.studios.map((studio) => studio.label),
            pornstars: data.pornstars.map((star) => star.label),
            categories: data.categories.map((category) => category.label),
            thumbnail: data.thumbnail,
            external_id: external_id,
            is_active: data.is_active ? 1 : 0,
            videoSources: data.videoSources.map((source) => ({
                file_size: source.file_size,
                file_type: source.file_type,
                quality: source.quality,
                url: source.url,
            })) || []
        };

        axios.post(`/edit-video`, payload).then(response => {
            if (response.data.success) {
                Swal.fire({
                    title: 'Success',
                    text: 'Video updated successfully!',
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then(() => {
                    router.push("/video/list");
                });
            } else {
                Swal.fire({
                    title: 'Error',
                    text: response.data.message || 'Failed to Edit video',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        }).catch(error => {
            Swal.fire({
                title: 'Error',
                text: 'Failed to Edit video',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        });

    };

    if (!slug) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div>
            <PageBreadcrumb pageTitle={`Edit Video - ${slug}`} />
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

                        <ComponentCard title="Category Details">
                            <CategoryDetails control={control} errors={errors} />
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
                    </div>
                </div>
                <button
                    type="submit"
                    className="ml-2 bg-blue-600 text-white px-4 mt-3 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                    Save Changes
                </button>
            </form>
        </div>
    );
}

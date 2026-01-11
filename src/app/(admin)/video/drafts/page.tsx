'use client';

import { useState } from 'react';
import {
    Plus,
    RefreshCw,
    Trash2,
    Search,
    Upload,
    Video as VideoIcon,
    Cloud,
} from 'lucide-react';
import { VideoSelectModal } from './VideoSelectModal';
import axios from '@/utils/axios';
import Swal from 'sweetalert2';
import { timeAgo } from "@/utils/commonFunc";
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Interface definitions
interface Video {
    title: string;
    thumbnail: string;
    link: string;
    datetime?: string;
    status: string | undefined;
    scrap_data: any;
    upload_status: string | 'pending';
    webhook_data: any;
    job_id: string | undefined;
    id: number;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
}

export default function DirectUploadPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    // State for modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRemoteUploadModalOpen, setIsRemoteUploadModalOpen] = useState(false);

    // --- DATA FETCHING ---
    const {
        data: mainVideos = [],
        isLoading,
        isRefetching,
        refetch
    } = useQuery({
        queryKey: ['draft-videos'],
        queryFn: async () => {
            const response = await axios.get<ApiResponse<Video[]>>('/draft-videos');
            return response.data.data;
        },
    });

    // --- MUTATIONS ---
    const deleteMutation = useMutation({
        mutationFn: async (link: string) => {
            return axios.post<ApiResponse<null>>('/delete-draft-video', { link });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['draft-videos'] });
        },
        onError: () => {
            Swal.fire({
                title: 'Error',
                text: 'Failed to delete draft video.',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        }
    });

    const remoteUploadMutation = useMutation({
        mutationFn: async (params: { link: string; id: number }) => {
            return axios.post('/add-to-remote-upload', params);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['draft-videos'] });
            Swal.fire({
                title: 'Success',
                text: 'Remote upload job added successfully.',
                icon: 'success',
                confirmButtonColor: '#9333ea',
                timer: 2000
            });
        },
        onError: () => {
            Swal.fire({
                title: 'Error',
                text: 'Failed to add remote upload job.',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        }
    });

    // --- HANDLERS ---
    const handleDeleteVideo = (link: string) => {
        Swal.fire({
            title: 'Delete Draft?',
            text: "You won't be able to revert this action!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it',
        }).then((result) => {
            if (result.isConfirmed) {
                deleteMutation.mutate(link);
            }
        });
    };

    const handleAddVideo = (video: Video) => {
        localStorage.setItem('selectedVideo', JSON.stringify({
            ...video?.scrap_data,
            video_sources: video.webhook_data?.r2_data || {}
        }));
        router.push('/video/add');
    };

    const handleRemoteUpload = (video: Video) => {
        Swal.fire({
            title: 'Start Remote Upload?',
            text: 'This will queue the video for remote upload to S3.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#9333ea',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Start Upload'
        }).then((result) => {
            if (result.isConfirmed) {
                remoteUploadMutation.mutate({ link: video.link, id: video.id });
            }
        });
    };

    const closeModal = () => {
        setIsModalOpen(false);
        // Slight delay to allow backend to process if needed, or just refetch
        setTimeout(() => refetch(), 500);
    };

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 p-6">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                            Draft Videos
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Manage and process your pending video uploads
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => refetch()}
                            className={`p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 ${isRefetching ? 'animate-spin' : ''}`}
                            title="Refresh List"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-200 active:scale-95"
                        >
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            <span className="font-medium">Add Video</span>
                        </button>
                    </div>
                </div>

                {/* Content Section */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 h-80 animate-pulse">
                                <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4 w-full" />
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
                                <div className="flex gap-2 mt-auto">
                                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex-1" />
                                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex-1" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : mainVideos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-full mb-4">
                            <VideoIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Draft Videos</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm text-center">
                            You haven't created any drafts yet. Click "Add Video" to get started with your first upload.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {mainVideos.map((video, index) => (
                            <div
                                key={video.id || index}
                                className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all duration-300 overflow-hidden flex flex-col"
                            >
                                {/* Thumbnail Section */}
                                <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-700">
                                    <img
                                        src={video.thumbnail}
                                        alt={video.title}
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                        loading="lazy"
                                    />

                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    {/* Status Badges - Top Right */}
                                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                                        <div className={`backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm flex items-center gap-1.5 border ${video.status === 'done'
                                            ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
                                            : video.status === 'pending'
                                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                                                : 'bg-gray-500/10 border-gray-500/20 text-gray-600 dark:text-gray-400'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${video.status === 'done' ? 'bg-green-500' :
                                                video.status === 'pending' ? 'bg-amber-500' : 'bg-gray-500'
                                                }`} />
                                            {video.status}
                                        </div>
                                    </div>

                                    {/* Time - Bottom Left Overlay */}
                                    <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <span className="text-white text-xs font-medium bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg">
                                            {timeAgo(video.datetime)}
                                        </span>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-5 flex flex-col flex-1">
                                    <div className="mb-4 flex-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base line-clamp-2 leading-snug mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={video.title}>
                                            {video.title}
                                        </h3>

                                        {/* Upload Status Badge */}
                                        {video.upload_status && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className={`px-2 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider flex items-center gap-1.5 border ${video.upload_status === 'completed' ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30' :
                                                    video.upload_status === 'failed' ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30' :
                                                        ['downloading', 'uploading'].includes(video.upload_status) ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30' :
                                                            'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30'
                                                    }`}>
                                                    <Cloud className="w-3 h-3" />
                                                    {video.upload_status}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions Grid */}
                                    <div className="grid grid-cols-4 gap-2 mt-auto pt-4 border-t border-gray-100 dark:border-gray-700/50">
                                        {video.status === 'done' && (
                                            <button
                                                onClick={() => handleAddVideo(video)}
                                                className="col-span-1 flex flex-col items-center justify-center p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors group/btn"
                                                title="Add to Library"
                                            >
                                                <Plus className="w-5 h-5 mb-0.5 group-hover/btn:scale-110 transition-transform" />
                                                <span className="text-[10px] font-medium">Add</span>
                                            </button>
                                        )}

                                        {video.status === 'done' && video.upload_status === 'pending' && (
                                            <button
                                                onClick={() => handleRemoteUpload(video)}
                                                className="col-span-1 flex flex-col items-center justify-center p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors group/btn"
                                                title="Remote Upload"
                                            >
                                                <Upload className="w-5 h-5 mb-0.5 group-hover/btn:scale-110 transition-transform" />
                                                <span className="text-[10px] font-medium">Upload</span>
                                            </button>
                                        )}

                                        <button
                                            onClick={() => window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(video.title)}`, '_blank')}
                                            className="col-span-1 flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors group/btn"
                                            title="Search Images"
                                        >
                                            <Search className="w-5 h-5 mb-0.5 group-hover/btn:scale-110 transition-transform" />
                                            <span className="text-[10px] font-medium">Search</span>
                                        </button>

                                        <button
                                            onClick={() => handleDeleteVideo(video.link)}
                                            className="col-span-1 flex flex-col items-center justify-center p-2 rounded-xl bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors group/btn"
                                            title="Delete Draft"
                                        >
                                            <Trash2 className="w-5 h-5 mb-0.5 group-hover/btn:scale-110 transition-transform" />
                                            <span className="text-[10px] font-medium">Delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            <VideoSelectModal
                isOpen={isModalOpen}
                onClose={closeModal}
            />
        </div>
    );
}
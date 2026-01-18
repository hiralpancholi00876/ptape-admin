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
    CheckCircle,
    X
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
    upload_status: 'not_started' | 'queued' | 'downloading' | 'ffmpeg' | 'uploading' | 'completed' | 'failed' | 'stopped';
    webhook_data: any;
    job_id: string | undefined;
    id: number;
    s3_key: string | null;
    s3_file_size: number | null;
}

interface VideoStatus {
    id: number;
    status: string;
    upload_status: 'not_started' | 'queued' | 'downloading' | 'ffmpeg' | 'uploading' | 'completed' | 'failed' | 'stopped';
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

    // State for selection
    const [selectedLinks, setSelectedLinks] = useState<string[]>([]);

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

    // --- POLLING STATUS ---
    const { data: statusUpdates } = useQuery({
        queryKey: ['draft-videos-status'],
        queryFn: async () => {
            const response = await axios.get<ApiResponse<VideoStatus[]>>('/draft-videos-status');
            return response.data.data;
        },
        refetchInterval: 2000,
        refetchIntervalInBackground: true,
        staleTime: 0,
    });

    // Merge status updates with main video list
    const mergedVideos = mainVideos.map(video => {
        const update = statusUpdates?.find(s => s.id === video.id);
        if (update) {
            return {
                ...video,
                status: update.status,
                upload_status: update.upload_status
            } as Video;
        }
        return video;
    });

    // --- MUTATIONS ---
    const deleteMutation = useMutation({
        mutationFn: async (link: string) => {
            return axios.post<ApiResponse<null>>('/delete-draft-video', { link });
        },
        onSuccess: () => {
            // We invalidate queries after all operations are done in bulk handler
        },
        onError: () => {
            // Error handling done in bulk handler
        }
    });

    const remoteUploadMutation = useMutation({
        mutationFn: async (params: { link: string; id: number }) => {
            return axios.post('/add-to-remote-upload', params);
        },
        onSuccess: () => {
            // We invalidate queries after all operations are done in bulk handler
        },
        onError: () => {
            // Error handling done in bulk handler
        }
    });

    // --- HANDLERS ---

    // Selection Handlers
    const toggleSelection = (link: string) => {
        setSelectedLinks(prev => {
            if (prev.includes(link)) {
                return prev.filter(l => l !== link);
            } else {
                return [...prev, link];
            }
        });
    };

    const selectAll = () => {
        if (selectedLinks.length === mergedVideos.length) {
            setSelectedLinks([]);
        } else {
            setSelectedLinks(mergedVideos.map(v => v.link));
        }
    };

    const clearSelection = () => {
        setSelectedLinks([]);
    };

    // Bulk Action Handlers
    const handleBulkDelete = () => {
        Swal.fire({
            title: `Delete ${selectedLinks.length} Videos?`,
            text: "You won't be able to revert this action!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete them',
        }).then(async (result) => {
            if (result.isConfirmed) {
                // Show loading state
                Swal.fire({
                    title: 'Deleting...',
                    text: 'Please wait',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                try {
                    // Execute all deletions
                    await Promise.all(selectedLinks.map(link => deleteMutation.mutateAsync(link)));

                    queryClient.invalidateQueries({ queryKey: ['draft-videos'] });
                    setSelectedLinks([]);

                    Swal.fire({
                        title: 'Deleted!',
                        text: 'Selected videos have been deleted.',
                        icon: 'success',
                        timer: 2000
                    });
                } catch (error) {
                    Swal.fire({
                        title: 'Error',
                        text: 'Failed to delete some videos.',
                        icon: 'error'
                    });
                }
            }
        });
    };

    const handleBulkUpload = () => {
        // Filter eligible videos: must be selected AND status='done' AND upload_status='not_started'
        const eligibleVideos = mergedVideos.filter(v =>
            selectedLinks.includes(v.link) &&
            ((v.status === 'done' && v.upload_status === 'not_started') ||
                (v.upload_status === 'stopped' || v.upload_status === 'failed'))
        );

        if (eligibleVideos.length === 0) {
            Swal.fire({
                title: 'No Eligible Videos',
                text: 'None of the selected videos are ready for upload (must be Done and Not Started).',
                icon: 'info'
            });
            return;
        }

        Swal.fire({
            title: `Upload ${eligibleVideos.length} Videos?`,
            text: 'This will queue the valid selected videos for remote upload.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#9333ea',
            confirmButtonText: 'Start Upload',
        }).then(async (result) => {
            if (result.isConfirmed) {
                // Show loading state
                Swal.fire({
                    title: 'Queueing Uploads...',
                    text: 'Please wait',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                try {
                    await Promise.all(eligibleVideos.map(v =>
                        remoteUploadMutation.mutateAsync({ link: v.link, id: v.id })
                    ));

                    queryClient.invalidateQueries({ queryKey: ['draft-videos'] });
                    setSelectedLinks([]); // Optional: clear selection after action

                    Swal.fire({
                        title: 'Success',
                        text: `${eligibleVideos.length} videos queued for upload.`,
                        icon: 'success',
                        timer: 2000
                    });
                } catch (error) {
                    Swal.fire({
                        title: 'Error',
                        text: 'Failed to queue some uploads.',
                        icon: 'error'
                    });
                }
            }
        });
    };

    // Single Item Handlers (legacy compatible)
    const handleDeleteVideo = (link: string) => {
        Swal.fire({
            title: 'Delete Draft?',
            text: "You won't be able to revert this action!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteMutation.mutateAsync(link);
                    queryClient.invalidateQueries({ queryKey: ['draft-videos'] });
                    // Also remove from selection if present
                    if (selectedLinks.includes(link)) {
                        toggleSelection(link);
                    }
                    Swal.fire({
                        title: 'Deleted!',
                        text: 'Video has been deleted.',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    });
                } catch (e) {
                    // Error handled by mutation or here
                }
            }
        });
    };

    const handleAddVideo = async (video: Video) => {
        // Show loading via Swal
        Swal.fire({
            title: 'Loading Data...',
            text: 'Fetching video details',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const response = await axios.get<ApiResponse<Video>>(`/draft-videos/${video.id}`);
            if (response.data.success) {
                const videoData = response.data.data;

                const storageData = {
                    ...videoData?.scrap_data,
                    video_sources: [{
                        url: videoData?.s3_key,
                        file_size: videoData?.s3_file_size
                    }]
                };

                localStorage.setItem('selectedVideo', JSON.stringify(storageData));
                Swal.close();
                router.push('/video/add');
            } else {
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to fetch video details',
                    icon: 'error'
                });
            }
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'Something went wrong fetching details',
                icon: 'error'
            });
        }
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
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await remoteUploadMutation.mutateAsync({ link: video.link, id: video.id });
                    queryClient.invalidateQueries({ queryKey: ['draft-videos'] });
                    Swal.fire({
                        title: 'Success',
                        text: 'Remote upload job added successfully.',
                        icon: 'success',
                        confirmButtonColor: '#9333ea',
                        timer: 2000
                    });
                } catch (e) {
                    // Error handled
                }
            }
        });
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => refetch(), 500);
    };

    // Derived state for bulk buttons
    const hasSelection = selectedLinks.length > 0;
    const uploadableCount = mergedVideos.filter(v =>
        selectedLinks.includes(v.link) &&
        ((v.status === 'done' && v.upload_status === 'not_started') ||
            (v.upload_status === 'stopped' || v.upload_status === 'failed'))
    ).length;

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 p-6">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 sticky top-4 z-20 backdrop-blur-xl bg-white/90 dark:bg-gray-800/90">
                    <div>
                        {hasSelection ? (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={clearSelection}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {selectedLinks.length} Selected
                                    </h1>
                                    <p className="text-sm text-gray-500">Select actions for items</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                                    Draft Videos
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">
                                    Manage and process your pending video uploads
                                </p>
                            </>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">

                        {hasSelection ? (
                            <>
                                {uploadableCount > 0 && (
                                    <button
                                        onClick={handleBulkUpload}
                                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-purple-600/20 transition-all duration-200"
                                    >
                                        <Cloud className="w-5 h-5" />
                                        <span className="font-medium">Upload ({uploadableCount})</span>
                                    </button>
                                )}
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-red-600/20 transition-all duration-200"
                                >
                                    <Trash2 className="w-5 h-5" />
                                    <span className="font-medium">Delete ({selectedLinks.length})</span>
                                </button>
                                <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />
                            </>
                        ) : null}

                        {/* Standard Actions */}
                        <button
                            onClick={selectAll}
                            className={`p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200`}
                            title={selectedLinks.length === mergedVideos.length && mergedVideos.length > 0 ? "Deselect All" : "Select All"}
                        >
                            <CheckCircle className={`w-5 h-5 ${selectedLinks.length === mergedVideos.length && mergedVideos.length > 0 ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                        </button>

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
                ) : mergedVideos.length === 0 ? (
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
                        {mergedVideos.map((video, index) => {
                            const isSelected = selectedLinks.includes(video.link);

                            return (
                                <div
                                    key={video.id || index}
                                    onClick={(e) => {
                                        // Don't trigger if clicking buttons
                                        if ((e.target as HTMLElement).closest('button')) return;
                                        toggleSelection(video.link);
                                    }}
                                    className={`group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden flex flex-col cursor-pointer
                                        ${isSelected
                                            ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xl'
                                            : 'border-gray-100 dark:border-gray-700 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 hover:border-blue-500/30'
                                        }
                                    `}
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
                                        <div className={`absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />

                                        {/* Selection Checkbox */}
                                        <div className="absolute top-3 left-3 z-10">
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-black/30 border-white/70 hover:bg-black/50'}`}>
                                                {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                                            </div>
                                        </div>

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
                                        <div className={`absolute bottom-3 left-3 transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
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

                                            {((video.status === 'done' && video.upload_status === 'not_started') || (video.upload_status === 'stopped' || video.upload_status === 'failed')) && (
                                                <button
                                                    onClick={() => handleRemoteUpload(video)}
                                                    className="col-span-1 flex flex-col items-center justify-center p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors group/btn"
                                                    title="Remote Upload"
                                                >
                                                    <Upload className="w-5 h-5 mb-0.5 group-hover/btn:scale-110 transition-transform" />
                                                    <span className="text-[10px] font-medium">{video.upload_status === 'stopped' || video.upload_status === 'failed' ? 'Retry' : 'Upload'}</span>
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
                            )
                        })}
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
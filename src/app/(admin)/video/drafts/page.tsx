'use client';

import { useState } from 'react';
import { Plus, RefreshCw, Trash2, Search, Upload, Video as VideoIcon, Cloud, CheckCircle, X } from 'lucide-react';
import { VideoSelectModal } from './VideoSelectModal';
import axios from '@/utils/axios';
import Swal from 'sweetalert2';
import { timeAgo } from "@/utils/commonFunc";
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Video {
    id: number;
    title: string;
    thumbnail: string;
    link: string;
    datetime?: string;
    status: string | undefined;
    scrap_data: any;
    upload_status: 'not_started' | 'queued' | 'downloading' | 'ffmpeg' | 'uploading' | 'completed' | 'failed' | 'stopped';
    upload_progress?: number;
    webhook_data: any;
    job_id: string | undefined;
    s3_key: string | null;
    s3_file_size: number | null;
}

interface VideoStatus {
    id: number;
    status: string;
    upload_status: Video['upload_status'];
    upload_progress: number;
}

export default function DirectUploadPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLinks, setSelectedLinks] = useState<string[]>([]);

    // Fetch videos
    const { data: mainVideos = [], isLoading, isRefetching, refetch } = useQuery({
        queryKey: ['draft-videos'],
        queryFn: async () => (await axios.get<{ data: Video[] }>('/draft-videos')).data.data,
    });

    // Poll status updates
    const { data: statusUpdates } = useQuery({
        queryKey: ['draft-videos-status'],
        queryFn: async () => (await axios.get<{ data: VideoStatus[] }>('/draft-videos-status')).data.data,
        refetchInterval: 2000,
        refetchIntervalInBackground: true,
        staleTime: 0,
    });

    // Merge status with videos
    const videos = mainVideos.map(video => {
        const update = statusUpdates?.find(s => s.id === video.id);
        return update ? { ...video, ...update } : video;
    });

    // Mutations
    const deleteMutation = useMutation({
        mutationFn: (link: string) => axios.post('/delete-draft-video', { link }),
    });

    const uploadMutation = useMutation({
        mutationFn: (params: { link: string; id: number }) => axios.post('/add-to-remote-upload', params),
    });

    // Selection helpers
    const isUploadable = (v: Video) =>
        (v.status === 'done' && v.upload_status === 'not_started') ||
        v.upload_status === 'stopped' ||
        v.upload_status === 'failed';

    const toggleSelect = (link: string) =>
        setSelectedLinks(prev => prev.includes(link) ? prev.filter(l => l !== link) : [...prev, link]);

    const selectAll = () =>
        setSelectedLinks(selectedLinks.length === videos.length ? [] : videos.map(v => v.link));

    const uploadableSelected = videos.filter(v => selectedLinks.includes(v.link) && isUploadable(v));

    // Actions
    const confirmAction = async (title: string, action: () => Promise<void>, successMsg: string) => {
        const result = await Swal.fire({
            title,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
        });
        if (result.isConfirmed) {
            Swal.fire({ title: 'Processing...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            try {
                await action();
                queryClient.invalidateQueries({ queryKey: ['draft-videos'] });
                Swal.fire({ title: 'Success!', text: successMsg, icon: 'success', timer: 2000 });
            } catch {
                Swal.fire({ title: 'Error', icon: 'error' });
            }
        }
    };

    const handleDelete = (link: string) =>
        confirmAction('Delete this video?', async () => void await deleteMutation.mutateAsync(link), 'Deleted!');

    const handleBulkDelete = () =>
        confirmAction(`Delete ${selectedLinks.length} videos?`, async () => {
            await Promise.all(selectedLinks.map(link => deleteMutation.mutateAsync(link)));
            setSelectedLinks([]);
        }, 'Videos deleted!');

    const handleUpload = (video: Video) =>
        confirmAction('Start upload?', async () => void await uploadMutation.mutateAsync({ link: video.link, id: video.id }), 'Upload queued!');

    const handleBulkUpload = () => {
        if (!uploadableSelected.length) {
            Swal.fire({ title: 'No eligible videos', icon: 'info' });
            return;
        }
        confirmAction(`Upload ${uploadableSelected.length} videos?`, async () => {
            await Promise.all(uploadableSelected.map(v => uploadMutation.mutateAsync({ link: v.link, id: v.id })));
            setSelectedLinks([]);
        }, 'Uploads queued!');
    };

    const handleAddVideo = async (video: Video) => {
        Swal.fire({ title: 'Loading...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        try {
            const res = await axios.get<{ data: Video }>(`/draft-videos/${video.id}`);
            const data = res.data.data;
            localStorage.setItem('selectedVideo', JSON.stringify({
                ...data?.scrap_data,
                video_sources: [{ url: data?.s3_key, file_size: data?.s3_file_size }]
            }));
            Swal.close();
            router.push('/video/add');
        } catch {
            Swal.fire({ title: 'Error', icon: 'error' });
        }
    };

    const hasSelection = selectedLinks.length > 0;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
            <div className="mx-auto space-y-6">

                {/* Header */}
                <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 sticky top-4 z-20">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {hasSelection && (
                                <button onClick={() => setSelectedLinks([])} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            )}
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                {hasSelection ? `${selectedLinks.length} Selected` : 'Draft Videos'}
                            </h1>
                        </div>

                        <div className="flex items-center gap-2">
                            {hasSelection ? (
                                <>
                                    {uploadableSelected.length > 0 && (
                                        <button onClick={handleBulkUpload} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm">
                                            <Cloud className="w-4 h-4" />
                                            Upload ({uploadableSelected.length})
                                        </button>
                                    )}
                                    <button onClick={handleBulkDelete} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm">
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl">
                                    <Plus className="w-5 h-5" />
                                    <span className="hidden sm:inline">Add Video</span>
                                </button>
                            )}

                            <button onClick={selectAll} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600">
                                <CheckCircle className={`w-5 h-5 ${selectedLinks.length === videos.length && videos.length > 0 ? 'text-blue-600' : 'text-gray-500'}`} />
                            </button>

                            <button onClick={() => refetch()} className={`p-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 ${isRefetching ? 'animate-spin' : ''}`}>
                                <RefreshCw className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 animate-pulse">
                                <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-xl mb-4" />
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : videos.length === 0 ? (
                    <div className="flex flex-col items-center py-20 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <VideoIcon className="w-12 h-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Draft Videos</h3>
                        <p className="text-gray-500 text-center max-w-sm">Click "Add Video" to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {videos.map(video => {
                            const isSelected = selectedLinks.includes(video.link);
                            const showUpload = isUploadable(video);

                            return (
                                <div
                                    key={video.id}
                                    onClick={(e) => { if (!(e.target as HTMLElement).closest('button')) toggleSelect(video.link); }}
                                    className={`group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden cursor-pointer transition-all border-2 
                                        ${isSelected ? 'border-blue-500 shadow-lg' : 'border-transparent hover:border-blue-300 hover:shadow-md'}`}
                                >
                                    {/* Thumbnail */}
                                    <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
                                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" loading="lazy" />

                                        {/* Progress bar */}
                                        {['uploading', 'downloading'].includes(video.upload_status) && (
                                            <div className="absolute bottom-0 inset-x-0 h-1 bg-gray-800/50">
                                                <div
                                                    className={`h-full ${video.upload_status === 'uploading' ? 'bg-blue-500' : 'bg-red-500'}`}
                                                    style={{ width: `${video.upload_progress || 0}%` }}
                                                />
                                            </div>
                                        )}

                                        {/* Selection indicator */}
                                        <div className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition
                                            ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-black/30 border-white/70'}`}>
                                            {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                                        </div>

                                        {/* Status badge */}
                                        <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium
                                            ${video.status === 'done' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'}`}>
                                            {video.status}
                                        </span>

                                        {/* Time */}
                                        <span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition">
                                            {timeAgo(video.datetime)}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 mb-2">{video.title}</h3>

                                        {video.upload_status && (
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium
                                                ${video.upload_status === 'completed' ? 'bg-green-100 text-green-700' :
                                                    video.upload_status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                <Cloud className="w-3 h-3" />
                                                {video.upload_status === 'not_started' ? 'Not Started' : video.upload_status}
                                            </span>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                                            {video.status === 'done' && (
                                                <button onClick={() => handleAddVideo(video)} className="flex-1 p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400" title="Add">
                                                    <Plus className="w-4 h-4 mx-auto" />
                                                </button>
                                            )}
                                            {showUpload && (
                                                <button onClick={() => handleUpload(video)} className="flex-1 p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400" title="Upload">
                                                    <Upload className="w-4 h-4 mx-auto" />
                                                </button>
                                            )}
                                            <button onClick={() => window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(video.title)}`, '_blank')} className="flex-1 p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400" title="Search">
                                                <Search className="w-4 h-4 mx-auto" />
                                            </button>
                                            <button onClick={() => handleDelete(video.link)} className="flex-1 p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400" title="Delete">
                                                <Trash2 className="w-4 h-4 mx-auto" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <VideoSelectModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setTimeout(() => refetch(), 500); }} />
        </div>
    );
}
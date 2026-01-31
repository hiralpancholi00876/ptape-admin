'use client';

import { useState, useCallback, useEffect } from 'react';
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import axios from "@/utils/axios";
import { timeAgo } from "@/utils/commonFunc";
import { X, Check, Loader2, Camera, ChevronLeft, ChevronRight, Search, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';

interface Video {
    title: string;
    link: string;
    thumbnail: string;
    datetime?: string;
    status: string | undefined;
    id: number;
    upload_status: string;
    s3_url: string | null;
    job_id: string | null;
}

interface VideoSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function VideoSelectModal({ isOpen, onClose }: VideoSelectModalProps) {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [selectedVideos, setSelectedVideos] = useState<Map<string, Video>>(new Map());

    // Fetch already selected videos
    const { data: alreadySelectedSet = new Set<string>() } = useQuery({
        queryKey: ['alreadySelectedVideos'],
        queryFn: async () => {
            const res = await axios.get('/check-already-selected-videos');
            return new Set<string>(res.data.data);
        },
        enabled: isOpen,
        staleTime: 1000 * 60 * 5,
    });

    // Fetch available videos
    const { data: videos = [], isLoading, isError, refetch } = useQuery({
        queryKey: ['availableVideos', page],
        queryFn: async () => {
            const res = await axios.post<{ success: boolean; data: Video[] }>('/fetch-fuckingsession', { page });
            return res.data.success ? res.data.data : [];
        },
        enabled: isOpen,
        placeholderData: (prev) => prev,
    });

    // Submit mutation
    const submitMutation = useMutation({
        mutationFn: (videosToSubmit: Video[]) => axios.post('/save-to-upload-draft', videosToSubmit),
        onSuccess: () => {
            Swal.fire({ title: 'Success!', text: 'Videos added to draft.', icon: 'success', timer: 1500, showConfirmButton: false });
            handleClose();
            queryClient.invalidateQueries({ queryKey: ['draft-videos'] });
        },
        onError: () => Swal.fire({ title: 'Error', text: 'Failed to add videos.', icon: 'error' }),
    });

    const handleClose = useCallback(() => {
        setSelectedVideos(new Map());
        setPage(1);
        onClose();
    }, [onClose]);

    const toggleSelection = (video: Video) => {
        const newMap = new Map(selectedVideos);
        newMap.has(video.link) ? newMap.delete(video.link) : newMap.set(video.link, video);
        setSelectedVideos(newMap);
    };

    const handleSubmit = () => {
        const list = Array.from(selectedVideos.values()).filter(v => !alreadySelectedSet.has(v.link));
        submitMutation.mutate(list);
    };

    const openScreenshot = async (link: string) => {
        try {
            const res = await axios.post<any>('/fetch-fuckingsession-screenshot', { link });
            if (res.data.success && res.data.data?.screenshotLink) {
                window.open(res.data.data.screenshotLink, '_blank');
            }
        } catch (error) {
            console.error("Error fetching screenshot:", error);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} className="max-w-6xl w-full p-0 rounded-xl mx-2 sm:mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Search className="w-5 h-5 text-blue-500" />
                        Select Videos
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Browse and select videos to import</p>
                </div>
                <button onClick={handleClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 min-h-[300px] max-h-[60vh] overflow-y-auto bg-gray-50 dark:bg-gray-900 relative">
                {isLoading && videos.length === 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden animate-pulse">
                                <div className="aspect-video bg-gray-200 dark:bg-gray-700" />
                                <div className="p-3 space-y-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : isError ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Failed to load videos</h3>
                        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">Try Again</Button>
                    </div>
                ) : videos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Search className="w-10 h-10 text-gray-400 mb-3" />
                        <p className="text-gray-500">No videos found on this page.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {videos.map((video) => {
                            const isSelected = selectedVideos.has(video.link);
                            const isImported = alreadySelectedSet.has(video.link);

                            return (
                                <div
                                    key={video.link}
                                    onClick={() => !isImported && toggleSelection(video)}
                                    className={`group relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden border-2 transition-all cursor-pointer
                                        ${isImported ? 'opacity-50 cursor-not-allowed grayscale border-gray-200 dark:border-gray-700' : ''}
                                        ${isSelected ? 'border-blue-500 shadow-lg' : 'border-transparent hover:border-blue-300 dark:hover:border-blue-600'}
                                    `}
                                >
                                    <div className="aspect-video relative bg-gray-200 dark:bg-gray-700">
                                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" loading="lazy" />

                                        {isSelected && (
                                            <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center">
                                                <Check className="w-4 h-4" />
                                            </div>
                                        )}

                                        {isImported && (
                                            <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center">
                                                <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded">Imported</span>
                                            </div>
                                        )}

                                        {!isImported && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openScreenshot(video.link); }}
                                                className="absolute top-2 left-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="View Screenshot"
                                            >
                                                <Camera className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="p-3">
                                        <h3 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 mb-2">{video.title}</h3>
                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                            <span>{timeAgo(video.datetime)}</span>
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold ${video.status ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                                                {video.status || 'New'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {isLoading && videos.length > 0 && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-black/30 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">{selectedVideos.size}</span> selected
                    {selectedVideos.size > 0 && (
                        <button onClick={() => setSelectedVideos(new Map())} className="text-xs text-red-500 hover:underline ml-2">Clear</button>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Pagination */}
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isLoading} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded disabled:opacity-30">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-3 text-sm font-medium">{page}</span>
                        <button onClick={() => setPage(p => p + 1)} disabled={isLoading} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded disabled:opacity-30">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Actions */}
                    <Button variant="outline" onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={selectedVideos.size === 0 || submitMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {submitMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving</> : `Add (${selectedVideos.size})`}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
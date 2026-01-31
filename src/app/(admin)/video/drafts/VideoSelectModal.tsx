'use client';

import { useState, useCallback, useEffect } from 'react';
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button"; // Keep using user's UI components
import axios from "@/utils/axios";
import { timeAgo } from "@/utils/commonFunc";
import {
    X,
    Check,
    Loader2,
    Camera,
    ChevronLeft,
    ChevronRight,
    Search,
    AlertCircle
} from 'lucide-react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';

interface Video {
    title: string;
    link: string; // Acts as ID
    thumbnail: string;
    datetime?: string;
    status: string | undefined;
    id: number;
    upload_status: string;
    s3_url: string | null;
    job_id: string | null;
}

interface ApiResponse {
    success: boolean;
    data: Video[];
}

interface VideoSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function VideoSelectModal({ isOpen, onClose }: VideoSelectModalProps) {
    const queryClient = useQueryClient();

    // --- State ---
    const [page, setPage] = useState(1);
    const [pageInput, setPageInput] = useState('1');
    const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());

    // Child Modal State
    const [screenshotLink, setScreenshotLink] = useState<string | null>(null);

    // --- Queries ---

    // 1. Fetch Already Selected (Excluded) Videos
    const { data: alreadySelectedSet = new Set<string>() } = useQuery({
        queryKey: ['alreadySelectedVideos'],
        queryFn: async () => {
            const res = await axios.get('/check-already-selected-videos');
            // Assuming res.data.data is an array of strings (links)
            return new Set<string>(res.data.data);
        },
        enabled: isOpen, // Only fetch when modal is open
        staleTime: 1000 * 60 * 5, // Cache for 5 mins
    });

    // 2. Fetch Available Videos (Pagination)
    const {
        data: videos = [],
        isLoading: isVideosLoading,
        isError,
        refetch
    } = useQuery({
        queryKey: ['availableVideos', page],
        queryFn: async () => {
            const res = await axios.post<ApiResponse>('/fetch-fuckingsession', { page });
            return res.data.success ? res.data.data : [];
        },
        enabled: isOpen,
        placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
    });

    // --- Mutations ---

    const submitMutation = useMutation({
        mutationFn: async (videosToSubmit: Video[]) => {
            return axios.post('/save-to-upload-draft', videosToSubmit);
        },
        onSuccess: () => {
            Swal.fire({
                title: 'Success!',
                text: 'Selected videos added to draft.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            handleClose();
            // Refresh the main draft list if needed (assumed parent handles this or invalidation needed)
            queryClient.invalidateQueries({ queryKey: ['draft-videos'] });
        },
        onError: () => {
            Swal.fire({
                title: 'Error',
                text: 'Failed to add videos.',
                icon: 'error'
            });
        }
    });

    // --- Handlers ---

    const handleClose = useCallback(() => {
        setSelectedVideos(new Set());
        setPage(1);
        setPageInput('1');
        onClose();
    }, [onClose]);

    const handlePageChange = (newPage: number) => {
        if (newPage < 1) return;
        setPage(newPage);
        setPageInput(String(newPage));
    };

    useEffect(() => {
        if (screenshotLink) {
            const fetchScreenshot = async () => {
                try {
                    const response = await axios.post<any>(`/fetch-fuckingsession-screenshot`, {
                        link: screenshotLink
                    });

                    if (response.data.success && response.data.data?.screenshotLink) {
                        window.open(response.data.data.screenshotLink, '_blank');
                    }
                } catch (error) {
                    console.error("Error fetching screenshot:", error);
                } finally {
                    setScreenshotLink(null);
                }
            };
            fetchScreenshot();
        }
    }, [screenshotLink]);

    const [knownVideos, setKnownVideos] = useState<Map<string, Video>>(new Map());

    // Let's use a simpler "AddToDraft" logic: 
    const toggleSelection = (video: Video) => {
        const newSet = new Set(selectedVideos);
        const newKnown = new Map(knownVideos);

        if (newSet.has(video.link)) {
            newSet.delete(video.link);
            newKnown.delete(video.link);
        } else {
            newSet.add(video.link);
            newKnown.set(video.link, video);
        }

        setSelectedVideos(newSet);
        setKnownVideos(newKnown);
    };

    const handleSubmit = () => {
        const list = Array.from(knownVideos.values()).filter(v => !alreadySelectedSet.has(v.link));
        submitMutation.mutate(list);
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                className="max-w-5xl w-[95vw] sm:w-full p-0 overflow-hidden rounded-xl sm:rounded-2xl mx-2 sm:mx-auto" // Improved mobile width
            >
                {/* Header */}
                <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-4 sm:p-5 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                            <span className="truncate">Select Videos</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            Browse and select videos to import
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1.5 sm:p-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2"
                    >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="bg-gray-50/50 dark:bg-gray-950/50 min-h-[300px] sm:min-h-[400px] md:min-h-[500px] max-h-[50vh] sm:max-h-[60vh] md:max-h-[65vh] overflow-y-auto p-3 sm:p-4 md:p-6 relative custom-scrollbar">

                    {isVideosLoading && videos.length === 0 ? (
                        // Loading State
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 animate-pulse">
                                    <div className="aspect-video bg-gray-200 dark:bg-gray-700" />
                                    <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                                        <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                        <div className="h-2.5 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : isError ? (
                        // Error State
                        <div className="flex flex-col items-center justify-center h-full py-12 sm:py-16 md:py-20 text-center px-4">
                            <div className="bg-red-50 dark:bg-red-900/20 p-3 sm:p-4 rounded-full mb-3 sm:mb-4">
                                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Failed to load videos</h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refetch()}
                                className="mt-3 sm:mt-4"
                            >
                                Try Again
                            </Button>
                        </div>
                    ) : videos.length === 0 ? (
                        // Empty State
                        <div className="flex flex-col items-center justify-center h-full py-12 sm:py-16 md:py-20 text-center px-4">
                            <div className="bg-gray-100 dark:bg-gray-800 p-4 sm:p-6 rounded-full mb-3 sm:mb-4">
                                <Search className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                            </div>
                            <p className="text-sm sm:text-base text-gray-500 font-medium">No videos found on this page.</p>
                        </div>
                    ) : (
                        // Video Grid
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                            {videos.map((video, index) => {
                                // Check both local selection AND api 'already selected'
                                const isSelected = selectedVideos.has(video.link);
                                const isAlreadyImported = alreadySelectedSet.has(video.link);

                                return (
                                    <div
                                        key={video.link || index}
                                        onClick={() => !isAlreadyImported && toggleSelection(video)}
                                        className={`group relative bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border-2 transition-all duration-200 overflow-hidden
                                            ${isAlreadyImported
                                                ? 'opacity-60 cursor-not-allowed border-gray-100 dark:border-gray-800 grayscale'
                                                : 'cursor-pointer hover:shadow-lg sm:hover:-translate-y-1'
                                            }
                                            ${isSelected
                                                ? 'border-blue-500 dark:border-blue-500 shadow-blue-500/10'
                                                : 'border-transparent hover:border-blue-200 dark:hover:border-blue-800'
                                            }
                                        `}
                                    >
                                        {/* Thumbnail */}
                                        <div className="aspect-video relative bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                            <img
                                                src={video.thumbnail}
                                                alt={video.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                loading="lazy"
                                            />

                                            {/* Overlays */}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                                            {/* Selection Checkmark */}
                                            {isSelected && (
                                                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-5 h-5 sm:w-7 sm:h-7 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg transform scale-100 transition-transform">
                                                    <Check className="w-3 h-3 sm:w-4 sm:h-4 stroke-[3]" />
                                                </div>
                                            )}

                                            {/* Already Imported Badge */}
                                            {isAlreadyImported && (
                                                <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                                                    <span className="bg-gray-900/80 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md font-medium">
                                                        Imported
                                                    </span>
                                                </div>
                                            )}

                                            {/* Screenshot Button */}
                                            {!isAlreadyImported && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setScreenshotLink(video.link);
                                                    }}
                                                    className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 p-1.5 sm:p-2 bg-black/50 hover:bg-black/70 text-white rounded-md sm:rounded-lg backdrop-blur-sm opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 sm:translate-y-2 sm:group-hover:translate-y-0"
                                                    title="View Screenshots"
                                                >
                                                    <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="p-2.5 sm:p-3 md:p-4">
                                            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm line-clamp-2 leading-snug mb-1.5 sm:mb-2 min-h-[2em] sm:min-h-[2.5em]" title={video.title}>
                                                {video.title}
                                            </h3>
                                            <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-2 sm:pt-3 mt-0.5 sm:mt-1">
                                                <span className="truncate">{timeAgo(video.datetime)}</span>
                                                <span className={`px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] uppercase font-semibold tracking-wide flex-shrink-0 ${video.status ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                    }`}>
                                                    {video.status || 'New'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Loading Overlay for Pagination */}
                    {isVideosLoading && videos.length > 0 && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-black/20 flex items-center justify-center z-10 backdrop-blur-[1px]">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-xl">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer / Controls */}
                <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-3 sm:p-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">

                    {/* Selection Count */}
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium text-gray-900 dark:text-white">{selectedVideos.size}</span>
                        <span>selected</span>
                        {selectedVideos.size > 0 && (
                            <button
                                onClick={() => {
                                    setSelectedVideos(new Set());
                                    setKnownVideos(new Map());
                                }}
                                className="text-[10px] sm:text-xs text-red-500 hover:text-red-600 hover:underline ml-1 sm:ml-2"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Pagination & Actions */}
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">

                        {/* Pagination Controls */}
                        <div className="flex items-center gap-0.5 sm:gap-1 bg-gray-100 dark:bg-gray-800 p-0.5 sm:p-1 rounded-lg">
                            <button
                                onClick={() => handlePageChange(Math.max(1, page - 1))}
                                disabled={page === 1 || isVideosLoading}
                                className="p-1.5 sm:p-2 hover:bg-white dark:hover:bg-gray-700 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            >
                                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>

                            <div className="flex items-center px-0.5 sm:px-1">
                                <input
                                    type="text"
                                    value={pageInput}
                                    onChange={(e) => setPageInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const p = parseInt(e.currentTarget.value);
                                            if (!isNaN(p)) handlePageChange(p);
                                        }
                                    }}
                                    onBlur={() => {
                                        const p = parseInt(pageInput);
                                        if (!isNaN(p)) handlePageChange(p);
                                        else setPageInput(String(page));
                                    }}
                                    className="w-8 sm:w-12 text-center bg-transparent text-xs sm:text-sm font-medium focus:outline-none border-b border-transparent focus:border-blue-500"
                                />
                            </div>

                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={isVideosLoading}
                                className="p-1.5 sm:p-2 hover:bg-white dark:hover:bg-gray-700 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            >
                                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                        </div>

                        <div className="w-px h-5 sm:h-6 bg-gray-200 dark:bg-gray-700 mx-0.5 sm:mx-1 hidden sm:block" />

                        {/* Action Buttons */}
                        <div className="flex gap-1.5 sm:gap-2">
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                className="border-gray-200 dark:border-gray-700 text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={selectedVideos.size === 0 || submitMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2"
                            >
                                {submitMutation.isPending ? (
                                    <><Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" /> Saving</>
                                ) : (
                                    <>Add ({selectedVideos.size})</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
}
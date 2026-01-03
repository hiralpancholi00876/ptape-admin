'use client';

import { useState, useEffect } from 'react';
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import axios from "@/utils/axios";
import { timeAgo } from "@/utils/commonFunc";
import { X, Check, Loader2, Camera } from 'lucide-react';
import { ScreenshotModal } from './ScreenshotModal';

// Required interfaces
interface Video {
    title: string;
    link: string;
    thumbnail: string;
    datetime?: string;
    status: string | undefined;
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
    const [availableVideos, setAvailableVideos] = useState<Video[]>([]);
    const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
    const [apiSelectedVideos, setApiSelectedVideos] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [pageInput, setPageInput] = useState<string>('1');
    const [isModalLoading, setIsModalLoading] = useState(false);
    const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false);
    const [hasMorePages, setHasMorePages] = useState(true);

    // State for the child Screenshot modal
    const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false);
    const [selectedVideoLink, setSelectedVideoLink] = useState<string | null>(null);

    // --- API CALL ---
    const fetchAvailableVideos = async (page: number) => {
        if (page === 1) {
            setIsModalLoading(true);
        } else {
            setIsLoadMoreLoading(true);
        }
        try {
            const response = await axios.post<ApiResponse>(`/fetch-fuckingsession`, { page: page });
            const { success, data } = response.data;
            if (success) {
                if (data && data.length > 0) {
                    setAvailableVideos((prevVideos) =>
                        page === 1 ? data : [...prevVideos, ...data]
                    );
                    setHasMorePages(true);
                } else {
                    setHasMorePages(false);
                    if (page === 1) setAvailableVideos([]);
                }
                setCurrentPage(page);
                setPageInput(String(page));
            } else {
                console.error('Failed to fetch videos');
                setHasMorePages(false);
            }
        } catch (error) {
            console.error('Error fetching session:', error);
            setHasMorePages(false);
        } finally {
            setIsModalLoading(false);
            setIsLoadMoreLoading(false);
        }
    };

    const alreadySelectedVideos = async () => {
        try {
            let response = await axios.get('/check-already-selected-videos');
            setSelectedVideos(new Set(response.data.data));
            setApiSelectedVideos(new Set(response.data.data));
        } catch (error) {
            console.error('Error checking already selected videos:', error);
        }
    };

    // --- Load videos when modal opens ---
    useEffect(() => {
        if (isOpen) {
            fetchAvailableVideos(1);
            alreadySelectedVideos();
        }
    }, [isOpen]);

    // --- Custom Close Handler ---
    const handleClose = () => {
        setAvailableVideos([]);
        setSelectedVideos(new Set());
        setCurrentPage(1);
        setIsModalLoading(false);
        setIsLoadMoreLoading(false);
        setHasMorePages(true);
        onClose();
    };

    // --- SELECTION LOGIC ---
    const handleVideoSelect = (videoId: string) => {
        const newSelected = new Set(selectedVideos);
        if (newSelected.has(videoId)) {
            newSelected.delete(videoId);
        } else {
            newSelected.add(videoId);
        }
        setSelectedVideos(newSelected);
    };

    // --- Screenshot Modal Handlers ---
    const openScreenshotModal = (e: React.MouseEvent, videoLink: string) => {
        e.stopPropagation();
        setSelectedVideoLink(videoLink);
        setIsScreenshotModalOpen(true);
    };

    const closeScreenshotModal = () => {
        setIsScreenshotModalOpen(false);
        setSelectedVideoLink(null);
    };

    // --- Add Videos Handler ---
    const handleAddClick = async () => {
        const videosToAdd = availableVideos.filter((v) =>
            selectedVideos.has(v.link)
        );

        const updatedAvailableVideos = availableVideos.filter(
            (video) => !selectedVideos.has(video.link)
        );

        setAvailableVideos(updatedAvailableVideos);
        setSelectedVideos(new Set());

        axios.post('/save-to-upload-draft', videosToAdd.filter(video => !apiSelectedVideos.has(video.link)));

        handleClose();
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                className="max-w-4xl p-0"
            >
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Select Videos to Add
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="max-h-[60vh] overflow-y-auto p-6">
                    {isModalLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : availableVideos.length === 0 ? (
                        <div className="flex justify-center items-center h-48">
                            <p className="text-gray-500">No videos found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {availableVideos.map((video, index: any) => {
                                const isSelected = selectedVideos.has(video.link);
                                return (
                                    <div
                                        key={index}
                                        onClick={() => handleVideoSelect(video.link)}
                                        className={`group relative bg-white rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${isSelected
                                            ? 'border-blue-500 shadow-lg'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center z-10">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                        <div className="aspect-video bg-gray-200 relative">
                                            <img
                                                src={video.thumbnail}
                                                alt={video.title}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={(e) => openScreenshotModal(e, video.link)}
                                                className="absolute top-2 left-2 z-10 p-1.5 bg-black bg-opacity-50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-75"
                                                title="Screenshot View"
                                            >
                                                <Camera size={16} />
                                            </button>
                                        </div>
                                        <div className="p-3">
                                            <h3 className="font-semibold text-gray-900 truncate text-sm">
                                                {video.title}
                                            </h3>
                                            <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600 space-y-1">
                                                <div className="flex justify-between">
                                                    <span>Time:</span>
                                                    <span className="font-medium">{timeAgo(video.datetime)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        {selectedVideos.size} video{selectedVideos.size !== 1 ? 's' : ''} selected
                    </p>
                    <div className="flex gap-3 items-center">
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchAvailableVideos(Math.max(1, currentPage - 1))}
                                disabled={isLoadMoreLoading || currentPage <= 1}
                            >
                                Prev
                            </Button>

                            <input
                                type="number"
                                min={1}
                                value={pageInput}
                                onChange={(e) => setPageInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = (e.target as HTMLInputElement).value;
                                        const p = Math.max(1, parseInt(val || '1', 10));
                                        if (!isNaN(p)) fetchAvailableVideos(p);
                                    }
                                }}
                                className="w-20 text-center border rounded px-2 py-1"
                                aria-label="Page number"
                            />

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchAvailableVideos(currentPage + 1)}
                                disabled={isLoadMoreLoading || !hasMorePages}
                            >
                                {isLoadMoreLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Next
                            </Button>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleAddClick}
                            disabled={selectedVideos.size === 0}
                            className="disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            Add Selected
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* The Screenshot modal is now a child of this modal */}
            <ScreenshotModal
                isOpen={isScreenshotModalOpen}
                onClose={closeScreenshotModal}
                link={selectedVideoLink}
            />
        </>
    );
}

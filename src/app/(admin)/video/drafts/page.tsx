'use client';

import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Trash2, Search, Upload, Video, Cloud } from 'lucide-react';
// Import the new modal component
import { VideoSelectModal } from './VideoSelectModal'; // Assuming it's in the same folder
import { RemoteUploadModal } from './RemoteUploadModal';
import axios from '@/utils/axios';
import Swal from 'sweetalert2';
import { timeAgo } from "@/utils/commonFunc";
import { useRouter } from 'next/navigation';

// Required interface
interface Video {
    title: string;
    thumbnail: string;
    link: string;
    datetime?: string;
    status: string | undefined;
    scrap_data: any;
    upload_status: string | 'pending';
    webhook_data: any;
    job_id: string | undefined; // remote upload job ID
    id: number; // draft_video_id
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
}

export default function DirectUploadPage() {
    const router = useRouter();
    const [mainVideos, setMainVideos] = useState<Video[]>([]);

    // State for the selection modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // State for remote upload modal
    const [isRemoteUploadModalOpen, setIsRemoteUploadModalOpen] = useState(false);

    // --- MODAL HANDLERS ---
    const openModal = () => setIsModalOpen(true);
    const closeModal = () => {
        setIsModalOpen(false);
        // Refresh main videos after closing modal
        setTimeout(() => {
            fetchMainVideos();
        }, 2000); // Slight delay to ensure modal has closed
    }

    const openRemoteUploadModal = () => setIsRemoteUploadModalOpen(true);
    const closeRemoteUploadModal = () => setIsRemoteUploadModalOpen(false);

    // Fetch main videos on component mount
    function fetchMainVideos() {
        // Fetch initial videos or perform any setup
        axios.get<ApiResponse<Video[]>>('/draft-videos').then(response => {
            setMainVideos(response.data.data);
        });
    }

    useEffect(() => {
        fetchMainVideos();
    }, []);

    const handleDeleteVideo = (link: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "This will delete the draft video. You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.post<ApiResponse<null>>('/delete-draft-video', { link });
                    setMainVideos(prev => prev.filter(video => video.link !== link));
                    Swal.fire('Deleted!', 'Draft video has been deleted.', 'success');
                } catch (error) {
                    Swal.fire('Error', 'Failed to delete draft video.', 'error');
                }
            }
        });
    };

    const handleAddVideo = (video: Video) => {
        localStorage.setItem('selectedVideo', JSON.stringify({ 
            ...video?.scrap_data, 
            video_sources:  video.webhook_data?.r2_data || {}
        }));
        router.push('/video/add');
    };

    const handleRemoteUpload = async (video: Video) => {
        Swal.fire({
            title: 'Start Remote Upload?',
            text: 'This will queue the video for remote upload to S3.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#9333ea',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, upload it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.post('/add-to-remote-upload', {
                        link: video.link,
                        id: video.id
                    });
                    Swal.fire('Success', 'Remote upload job added successfully.', 'success');
                    fetchMainVideos(); // Refresh to get updated status
                } catch (error) {
                    Swal.fire('Error', 'Failed to add remote upload job.', 'error');
                }
            }
        });
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Draft Upload Videos</h1>
                <p className="text-gray-600 mt-2">Manage video uploads</p>
                <div className='flex justify-end gap-4'>
                    <button
                        onClick={fetchMainVideos}
                        className="mt-2 flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <RefreshCw className="h-5 w-5" />
                    </button>
                    <button onClick={openModal} className="mt-2 flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        <Plus className="h-5 w-5" />
                        <span>Add Video</span>
                    </button>
                    <button 
                        onClick={openRemoteUploadModal} 
                        className="mt-2 flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <Upload className="h-5 w-5" />
                        <span>Remote Upload</span>
                    </button>
                </div>
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-4 sm:gap-6">
                {/* Main page videos */}
                {mainVideos.map((video, index) => (
                    <div
                        key={video.id || index}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-200 group"
                    >
                        {/* Thumbnail with overlay */}
                        <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                            <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                        </div>

                        {/* Content */}
                        <div className="p-3 sm:p-4">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base line-clamp-2 leading-tight mb-2" title={video.title}>
                                {video.title}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                {timeAgo(video.datetime)}
                            </p>

                            {/* Status badges */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium shadow-sm ${
                                    video.status === 'done' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                                    video.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                                    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                                }`} title="Video Status">
                                    <Video size={12} />
                                    {video.status}
                                </span>
                                {video.upload_status && (
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium shadow-sm ${
                                        video.upload_status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                                        video.upload_status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
                                        video.upload_status === 'downloading' || video.upload_status === 'uploading' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                                        video.upload_status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                                        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                                    }`} title="Upload Status">
                                        <Cloud size={12} />
                                        {video.upload_status}
                                    </span>
                                )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2">
                                {video.status === 'done' && (
                                    <button
                                        onClick={() => handleAddVideo(video)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                        title="Add Video"
                                    >
                                        <Plus size={14} className="text-blue-600 dark:text-blue-400" />
                                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 hidden sm:inline">Add</span>
                                    </button>
                                )}
                                {video.status === 'done' && (video.upload_status === 'pending') && (
                                    <button
                                        onClick={() => handleRemoteUpload(video)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                                        title="Remote Upload"
                                    >
                                        <Upload size={14} className="text-purple-600 dark:text-purple-400" />
                                        <span className="text-xs font-medium text-purple-600 dark:text-purple-400 hidden sm:inline">Upload</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => window.open(`https://www.google.com/search?tbm=isch&q=${video.title}`, '_blank')}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                                    title="Search Images"
                                >
                                    <Search size={14} className="text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hidden sm:inline">Search</span>
                                </button>
                                <button
                                    onClick={() => handleDeleteVideo(video.link)}
                                    className="flex items-center justify-center p-2 rounded-lg bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={14} className="text-red-500 dark:text-red-400" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Video Selection Modal */}
            <VideoSelectModal
                isOpen={isModalOpen}
                onClose={closeModal}
            />

            {/* Remote Upload Modal */}
            <RemoteUploadModal
                isOpen={isRemoteUploadModalOpen}
                onClose={closeRemoteUploadModal}
            />
        </div>
    );
}
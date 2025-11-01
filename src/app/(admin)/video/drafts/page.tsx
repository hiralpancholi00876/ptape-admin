'use client';

import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
// Import the new modal component
import { VideoSelectModal } from './VideoSelectModal'; // Assuming it's in the same folder
import axios from '@/utils/axios';
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

    // --- MODAL HANDLERS ---
    const openModal = () => setIsModalOpen(true);
    const closeModal = () => {
        setIsModalOpen(false);
        // Refresh main videos after closing modal
        setTimeout(() => {
            fetchMainVideos();
        }, 2000); // Slight delay to ensure modal has closed
    }

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
        setMainVideos(mainVideos.filter(video => video.link !== link));
        axios.post<ApiResponse<null>>('/delete-draft-video', { link });
    };

    const handleAddVideo = (video: Video) => {
        localStorage.setItem('selectedVideo', JSON.stringify(video?.scrap_data));
        router.push('/video/add');
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Direct Upload Videos</h1>
                <p className="text-gray-600 mt-2">Manage your video uploads</p>
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
                </div>
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Main page videos */}
                {mainVideos.map((video, index) => (
                    <div
                        key={index} // --- FIX: Always use unique ID
                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    >
                        <div className="aspect-video bg-gray-200 relative">
                            <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="p-4">
                            <h3 className="font-semibold text-gray-900 truncate">{video.title}</h3>
                            <p className="text-sm text-gray-600">{timeAgo(video.datetime)}</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${video.status === 'done' ? 'bg-green-100 text-green-800' :
                                video.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                {video.status}
                            </span>
                            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                                <button
                                    onClick={() => handleAddVideo(video)} // --- FIX: Pass ID
                                    className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                    <Plus size={16} className="text-gray-600" />
                                    <span className="text-sm text-gray-600">Add</span>
                                </button>
                                <button
                                    onClick={() => handleDeleteVideo(video.link)} // --- FIX: Pass ID
                                    className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                                >
                                    <Trash2 size={16} className="text-red-500" />
                                    <span className="text-sm text-red-500">Delete</span>
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
        </div>
    );
}
'use client';

import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Trash2, Search, Upload } from 'lucide-react';
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
        localStorage.setItem('selectedVideo', JSON.stringify(video?.scrap_data));
        router.push('/video/add');
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
                    <button 
                        onClick={openRemoteUploadModal} 
                        className="mt-2 flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <Upload className="h-5 w-5" />
                        <span>Remote Upload</span>
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
                                <button
                                    onClick={() => window.open(`https://www.google.com/search?tbm=isch&q=${video.title}`, '_blank')} // --- FIX: Pass ID
                                    className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
                                >
                                    <Search size={16} className="text-green-500" />
                                    <span className="text-sm text-green-500">Search</span>
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
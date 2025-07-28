'use client';

import React, { useState, useEffect } from 'react';
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import axios from "@/utils/axios";
import { Eye, Globe, Film, Search, Plus, Pencil, Trash2 } from "lucide-react";
import ToggleSwitch from "@/components/form/switch/Switch";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import Swal from 'sweetalert2';

interface Studio {
    studio_id: number;
    name: string;
    website: string | null;
    video_count: number;
    total_views: number;
    slug: string;
    is_active: number;
}

export default function StudiosPage() {
    const [studios, setStudios] = useState<Studio[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const { isOpen, openModal, closeModal } = useModal();
    const { isOpen: isOpenEdit, openModal: openModalEdit, closeModal: closeModalEdit } = useModal();
    const [editData, setEditData] = useState<{ studio_id: number | null, name: string, website: string | null }>({ studio_id: null, name: '', website: null });

    const fetchStudios = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/studios');
            if (response.data.success) {
                setStudios(response.data.data);
                setError(null);
            } else {
                setError('Failed to fetch studios');
            }
        } catch (error) {
            setError('Error fetching studios. Please try again.');
            console.error('Error fetching studios:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStudios();
    }, []);

    const filteredStudios = studios.filter(studio =>
        studio.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDeleteStudio = async (studioId: number) => {

        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                await axios.post(`/delete`, {
                    id: studioId,
                    type: 'studio'
                });

                setStudios(studios.filter(studio => studio.studio_id !== studioId));

                Swal.fire(
                    'Deleted!',
                    'Your video has been deleted.',
                    'success'
                );
            }
        });
    };

    const handleToggle = async (studio_id: number, isActive: boolean) => {
        try {
            await axios.post(`/active-inactive`, {
                id: studio_id,
                type: "studio",
                action: isActive
            });

            // state update
            setStudios(prevStudios =>
                prevStudios.map(studio =>
                    studio.studio_id === studio_id ? { ...studio, is_active: isActive ? 1 : 0 } : studio
                )
            );

            return true;
        }
        catch (error) {
            return false;
        }
    };

    return (
        <div className="p-4 md:p-6">

            {isOpen && <AddStudioModal />}
            {isOpenEdit && <EditStudioModel {...editData} />}

            {/* Page Breadcrumb */}
            <PageBreadcrumb pageTitle="Studios" />
            {/* Header with search and add button */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative w-full md:w-64">
                    <input
                        type="text"
                        placeholder="Search studios..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                </div>


                <Button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors" size="sm" onClick={openModal}>
                    <Plus size={18} className="mr-2" />
                    Add New Studio
                </Button>
            </div>

            {/* Error message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Loading indicator */}
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                /* Studios grid */
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {filteredStudios.length > 0 ? (
                        filteredStudios.map((studio) => (
                            <div
                                key={studio.studio_id}
                                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-200 text-center"
                            >
                                <div className="p-4 flex flex-col items-center">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{studio.name}</h3>

                                    <div className="flex items-center text-gray-600 mb-1">
                                        <Film size={16} className="mr-2" />
                                        <span>{studio.video_count} videos</span>
                                    </div>

                                    <div className="flex items-center text-gray-600 mb-1">
                                        <Eye size={16} className="mr-2" />
                                        <span>{studio.total_views.toLocaleString()} views</span>
                                    </div>


                                    <div className="flex items-center text-gray-600 mb-3">
                                        <Globe size={16} className="mr-2" />
                                        {studio.website ? (
                                            <a
                                                href={studio.website.startsWith('http') ? studio.website : `https://${studio.website}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:underline truncate"
                                            >
                                                {(() => {
                                                    try {
                                                        return new URL(studio.website.startsWith('http') ? studio.website : `https://${studio.website}`).hostname;
                                                    } catch {
                                                        return studio.website;
                                                    }
                                                })()}
                                            </a>
                                        ) : (
                                            <span className="text-gray-400">No Website</span>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">

                                        <div className="flex space-x-2">
                                            <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors" onClick={() => {
                                                openModalEdit();
                                                setEditData({ studio_id: studio.studio_id, name: studio.name, website: studio.website });
                                            }}>
                                                <Pencil size={18} className="text-gray-600" />
                                            </button>

                                            <button
                                                onClick={() => handleDeleteStudio(studio.studio_id)}
                                                className="p-2 rounded-full bg-gray-100 hover:bg-red-100 transition-colors"
                                            >
                                                <Trash2 size={18} className="text-red-500" />
                                            </button>
                                            <ToggleSwitch
                                                label="Active"
                                                checked={studio.is_active === 1}
                                                onChange={(checked) => handleToggle(studio.studio_id, checked)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full flex justify-center items-center h-64 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="text-center">
                                <p className="text-gray-500 mb-2">No studios found</p>
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="text-blue-500 hover:underline"
                                    >
                                        Clear search
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    function AddStudioModal() {

        const [studioName, setStudioName] = useState('');
        const [websiteUrl, setWebsiteUrl] = useState<string | null>('');

        const handleSave = async (e: React.FormEvent) => {
            e.preventDefault();
            try {

                const response = await axios.post('/add-studio', {
                    name: studioName,
                    website: websiteUrl === '' ? null : websiteUrl
                });

                if (response.data.success) {
                    setStudioName('');
                    setWebsiteUrl('');
                    closeModal();
                    fetchStudios();
                    // Optionally, you can refetch studios here
                    Swal.fire({
                        title: 'Success',
                        text: 'Studio added successfully!',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    });
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: 'Failed to add studio',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            } catch (error) {
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to add studio',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        };

        return (<Modal
            isOpen={isOpen}
            onClose={closeModal}
            className="max-w-[584px] p-5 lg:p-10"
        >
            <form className="" onSubmit={handleSave}>
                <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
                    Add New Studio
                </h4>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                    <div className="col-span-1 sm:col-span-2">
                        <Label>Studio Name</Label>
                        <Input type="text" placeholder="Brazzers" required={true} onChange={(e) => setStudioName(e.target.value)} />
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                        <Label>Website Url</Label>
                        <Input type="text" placeholder="Website Url" onChange={(e) => setWebsiteUrl(e.target.value)} />
                    </div>
                </div>

                <div className="flex items-center justify-end w-full gap-3 mt-6">
                    <Button size="sm" variant="outline" onClick={closeModal}>
                        Close
                    </Button>
                    <Button size="sm">
                        Save Changes
                    </Button>
                </div>
            </form>
        </Modal>)
    }

    function EditStudioModel(data: any) {

        const [studioName, setStudioName] = useState('');
        const [websiteUrl, setWebsiteUrl] = useState<string | null>('');

        const handleSave = async (e: React.FormEvent) => {
            e.preventDefault();
            try {

                const response = await axios.post('/edit-studio', {
                    studio_id: data.studio_id,
                    name: studioName === '' ? data.name : studioName,
                    website: websiteUrl === '' ? data.website : websiteUrl
                });

                if (response.data.success) {
                    setStudioName('');
                    setWebsiteUrl('');
                    closeModalEdit();
                    fetchStudios();
                    // Optionally, you can refetch studios here
                    Swal.fire({
                        title: 'Success',
                        text: 'Studio Updated successfully!',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    });
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: 'Failed to Update studio',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            } catch (error) {
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to Update studio',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        };

        return (<Modal
            isOpen={isOpenEdit}
            onClose={closeModalEdit}
            className="max-w-[584px] p-5 lg:p-10"
        >
            <form className="" onSubmit={handleSave}>
                <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
                    Edit Studio
                </h4>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                    <div className="col-span-1 sm:col-span-2">
                        <Label>Studio Name</Label>
                        <Input type="text" defaultValue={data.name} placeholder="Brazzers" required={true} onChange={(e) => setStudioName(e.target.value)} />
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                        <Label>Website Url</Label>
                        <Input type="text" defaultValue={data.website} placeholder="Website Url" onChange={(e) => setWebsiteUrl(e.target.value)} />
                    </div>
                </div>

                <div className="flex items-center justify-end w-full gap-3 mt-6">
                    <Button size="sm" variant="outline" onClick={closeModalEdit}>
                        Close
                    </Button>
                    <Button size="sm">
                        Save Changes
                    </Button>
                </div>
            </form>
        </Modal>)
    }
}


'use client';

import React, { useState, useEffect } from 'react';
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import axios from "@/utils/axios";
import { Search, Plus, Film, Pencil, Trash2, Tag } from "lucide-react";
import ToggleSwitch from "@/components/form/switch/Switch";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import Swal from 'sweetalert2';

interface Tag {
    tag_id: number;
    name: string;
    video_count: number;
    slug: string;
    is_active: number;
}

// Generate a color based on name
const getColorFromName = (name: string) => {
    const colors = [
        'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 
        'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
};

export default function TagPage() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const { isOpen, openModal, closeModal } = useModal();
    const { isOpen: isOpenEdit, openModal: openModalEdit, closeModal: closeModalEdit } = useModal();
    const [editData, setEditData] = useState<{ tag_id: number | null, name: string }>({ 
        tag_id: null, 
        name: ''
    });

    const fetchTags = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/tags');
            if (response.data.success) {
                setTags(response.data.data);
                setError(null);
            } else {
                setError('Failed to fetch tags');
            }
        } catch (error) {
            setError('Error fetching tags. Please try again.');
            console.error('Error fetching tags:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTags();
    }, []);

    const filteredTags = tags.filter(tag =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDeleteTag = async (tagId: number) => {
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
                    id: tagId,
                    type: 'tag'
                });

                setTags(tags.filter(tag => tag.tag_id !== tagId));

                Swal.fire(
                    'Deleted!',
                    'Tag has been deleted.',
                    'success'
                );
            }
        });
    };

    const handleToggle = async (tag_id: number, isActive: boolean) => {
        try {
            await axios.post(`/active-inactive`, {
                id: tag_id,
                type: "tag",
                action: isActive
            });

            // state update
            setTags(prevTags =>
                prevTags.map(tag =>
                    tag.tag_id === tag_id ? { ...tag, is_active: isActive ? 1 : 0 } : tag
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

            {isOpen && <AddTagModal />}
            {isOpenEdit && <EditTagModal {...editData} />}

            {/* Page Breadcrumb */}
            <PageBreadcrumb pageTitle="Tags" />
            {/* Header with search and add button */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative w-full md:w-64">
                    <input
                        type="text"
                        placeholder="Search tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                </div>


                <Button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors" size="sm" onClick={openModal}>
                    <Plus size={18} className="mr-2" />
                    Add New Tag
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
                /* Tags grid */
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {filteredTags.length > 0 ? (
                        filteredTags.map((tag) => (
                            <div
                                key={tag.tag_id}
                                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-200 text-center"
                            >
                                <div className="p-4 flex flex-col items-center">
                                    
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{tag.name}</h3>

                                    <div className="flex items-center text-gray-600 mb-1">
                                        <Film size={16} className="mr-2" />
                                        <span>{tag.video_count} videos</span>
                                    </div>

                                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                                        <div className="flex space-x-2">
                                            <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors" onClick={() => {
                                                openModalEdit();
                                                setEditData({ 
                                                    tag_id: tag.tag_id, 
                                                    name: tag.name
                                                });
                                            }}>
                                                <Pencil size={18} className="text-gray-600" />
                                            </button>

                                            <button
                                                onClick={() => handleDeleteTag(tag.tag_id)}
                                                className="p-2 rounded-full bg-gray-100 hover:bg-red-100 transition-colors"
                                            >
                                                <Trash2 size={18} className="text-red-500" />
                                            </button>
                                            <ToggleSwitch
                                                label="Active"
                                                defaultChecked={tag.is_active === 1}
                                                onChange={(checked) => handleToggle(tag.tag_id, checked)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full flex justify-center items-center h-64 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="text-center">
                                <p className="text-gray-500 mb-2">No tags found</p>
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

    function AddTagModal() {
        const [tagName, setTagName] = useState('');

        const handleSave = async (e: React.FormEvent) => {
            e.preventDefault();
            
            try {
                // Create JSON payload
                const payload = {
                    name: tagName
                };

                const response = await axios.post('/add-tag', payload, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data.success) {
                    setTagName('');
                    closeModal();
                    fetchTags();
                    
                    Swal.fire({
                        title: 'Success',
                        text: 'Tag added successfully!',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    });
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: 'Failed to add tag',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            } catch (error) {
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to add tag',
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
                    Add New Tag
                </h4>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                    <div className="col-span-1 sm:col-span-2">
                        <Label>Tag Name</Label>
                        <Input 
                            type="text"
                            placeholder="Enter tag name" 
                            required={true}
                            onChange={(e) => setTagName(e.target.value)}
                        />
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

    function EditTagModal(data: any) {
        const [tagName, setTagName] = useState(data.name || '');

        const handleSave = async (e: React.FormEvent) => {
            e.preventDefault();
            try {
                // Create JSON payload
                const payload = {
                    tag_id: data.tag_id,
                    name: tagName
                };

                const response = await axios.post('/edit-tag', payload, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data.success) {
                    setTagName('');
                    closeModalEdit();
                    fetchTags();
                    
                    Swal.fire({
                        title: 'Success',
                        text: 'Tag updated successfully!',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    });
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: 'Failed to update tag',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            } catch (error) {
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to update tag',
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
                    Edit Tag
                </h4>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                    <div className="col-span-1 sm:col-span-2">
                        <Label>Tag Name</Label>
                        <Input 
                            type="text"
                            placeholder="Enter tag name" 
                            defaultValue={data.name}
                            required={true}
                            onChange={(e) => setTagName(e.target.value)}
                        />
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
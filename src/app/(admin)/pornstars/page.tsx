'use client';

import React, { useState, useEffect } from 'react';
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import axios from "@/utils/axios";
import { Eye, Globe, Film, Search, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import ToggleSwitch from "@/components/form/switch/Switch";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import Swal from 'sweetalert2';

interface Pornstar {
    pstar_id: number;
    name: string;
    social_links: string | null;
    video_count: number;
    total_views: number;
    slug: string;
    is_active: number;
    profile_pic: string | null;
}

// Generate initials for profile picture placeholder
const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) {
        return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

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

export default function PornstarPage() {
    const [pornstars, setPornstars] = useState<Pornstar[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const { isOpen, openModal, closeModal } = useModal();
    const { isOpen: isOpenEdit, openModal: openModalEdit, closeModal: closeModalEdit } = useModal();
    const [editData, setEditData] = useState<{
        pstar_id: number | null,
        name: string,
        social_links: string | Array<{ name: string, link: string }> | null,
        profile_pic: string | null
    }>({
        pstar_id: null,
        name: '',
        social_links: null,
        profile_pic: null
    });

    const fetchPornstars = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/pornstars');
            if (response.data.success) {
                setPornstars(response.data.data);
                setError(null);
            } else {
                setError('Failed to fetch pornstars');
            }
        } catch (error) {
            setError('Error fetching pornstars. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPornstars();
    }, []);

    const filteredPornstars = pornstars.filter(pornstar =>
        pornstar.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDeletePornstar = async (pstarId: number) => {
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
                    id: pstarId,
                    type: 'pornstar'
                });

                setPornstars(pornstars.filter(pornstar => pornstar.pstar_id !== pstarId));

                Swal.fire(
                    'Deleted!',
                    'Pornstar has been deleted.',
                    'success'
                );
            }
        });
    };

    const handleToggle = async (pstar_id: number, isActive: boolean) => {
        try {
            await axios.post(`/active-inactive`, {
                id: pstar_id,
                type: "pornstar",
                action: isActive
            });

            // state update
            setPornstars(prevPornstars =>
                prevPornstars.map(pornstar =>
                    pornstar.pstar_id === pstar_id ? { ...pornstar, is_active: isActive ? 1 : 0 } : pornstar
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

            {isOpen && <AddPornstarModal />}
            {isOpenEdit && <EditPornstarModel {...editData} />}

            {/* Page Breadcrumb */}
            <PageBreadcrumb pageTitle="Pornstars" />
            {/* Header with search and add button */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative w-full md:w-64">
                    <input
                        type="text"
                        placeholder="Search pornstars..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                </div>


                <Button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors" size="sm" onClick={openModal}>
                    <Plus size={18} className="mr-2" />
                    Add New Pornstar
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
                /* Pornstars grid */
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {filteredPornstars.length > 0 ? (
                        filteredPornstars.map((pornstar) => (
                            <div
                                key={pornstar.pstar_id}
                                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-200 text-center"
                            >
                                <div className="p-4 flex flex-col items-center">
                                    {/* Profile Image */}
                                    {pornstar.profile_pic ? (
                                        <div className="w-24 h-24 mb-3 overflow-hidden rounded-full">
                                            <img
                                                src={pornstar.profile_pic}
                                                alt={pornstar.name}
                                                width={96}
                                                height={96}
                                                className="object-cover w-full h-full"
                                                referrerPolicy='no-referrer'
                                            />
                                        </div>
                                    ) : (
                                        <div className={`w-24 h-24 mb-3 rounded-full flex items-center justify-center text-2xl font-bold text-white ${getColorFromName(pornstar.name)}`}>
                                            {getInitials(pornstar.name)}
                                        </div>
                                    )}

                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{pornstar.name}</h3>

                                    <div className="flex items-center text-gray-600 mb-1">
                                        <Film size={16} className="mr-2" />
                                        <span>{pornstar.video_count} videos</span>
                                    </div>

                                    <div className="flex items-center text-gray-600 mb-1">
                                        <Eye size={16} className="mr-2" />
                                        <span>{pornstar.total_views.toLocaleString()} views</span>
                                    </div>


                                    <div className="flex items-center text-gray-600 mb-3">
                                        <Globe size={16} className="mr-2" />
                                        <span>{pornstar.social_links ? <Check className='text-green-500' strokeWidth={3} /> : <X className='text-red-500' strokeWidth={3} />}</span>
                                    </div>

                                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">

                                        <div className="flex space-x-2">
                                            <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors" onClick={() => {
                                                openModalEdit();

                                                setEditData({
                                                    pstar_id: pornstar.pstar_id,
                                                    name: pornstar.name,
                                                    social_links: pornstar.social_links,
                                                    profile_pic: pornstar.profile_pic
                                                });
                                            }}>
                                                <Pencil size={18} className="text-gray-600" />
                                            </button>

                                            <button
                                                onClick={() => handleDeletePornstar(pornstar.pstar_id)}
                                                className="p-2 rounded-full bg-gray-100 hover:bg-red-100 transition-colors"
                                            >
                                                <Trash2 size={18} className="text-red-500" />
                                            </button>
                                            <ToggleSwitch
                                                label="Active"
                                                checked={pornstar.is_active === 1}
                                                onChange={(checked) => handleToggle(pornstar.pstar_id, checked)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full flex justify-center items-center h-64 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="text-center">
                                <p className="text-gray-500 mb-2">No pornstars found</p>
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

    function AddPornstarModal() {
        const [pornstarName, setPornstarName] = useState('');
        const [socialLinks, setSocialLinks] = useState<Array<{ name: string, link: string }>>([{ name: '', link: '' }]);
        const [profilePicUrl, setProfilePicUrl] = useState<string>('');
        const [previewUrl, setPreviewUrl] = useState<string | null>(null);

        const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const url = e.target.value;
            setProfilePicUrl(url);
            setPreviewUrl(url);
        };

        const handleSocialLinkChange = (index: number, field: 'name' | 'link', value: string) => {
            const updatedLinks = [...socialLinks];
            updatedLinks[index][field] = value;
            setSocialLinks(updatedLinks);
        };

        const addSocialLink = () => {
            setSocialLinks([...socialLinks, { name: '', link: '' }]);
        };

        const removeSocialLink = (index: number) => {
            if (socialLinks.length > 1) {
                const updatedLinks = [...socialLinks];
                updatedLinks.splice(index, 1);
                setSocialLinks(updatedLinks);
            }
        };

        const handleSave = async (e: React.FormEvent) => {
            e.preventDefault();

            try {
                // Filter out empty social links
                const validSocialLinks = socialLinks.filter(link => link.name.trim() !== '' && link.link.trim() !== '');

                // Create JSON payload
                const payload = {
                    name: pornstarName,
                    profile_pic: profilePicUrl,
                    social_links: validSocialLinks
                };

                const response = await axios.post('/add-pornstar', payload, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data.success) {
                    setPornstarName('');
                    setSocialLinks([{ name: '', link: '' }]);
                    setProfilePicUrl('');
                    setPreviewUrl(null);
                    closeModal();
                    fetchPornstars();

                    Swal.fire({
                        title: 'Success',
                        text: 'Pornstar added successfully!',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    });
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: 'Failed to add pornstar',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            } catch (error) {
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to add pornstar',
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
                    Add New Pornstar
                </h4>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                    <div className="col-span-1 sm:col-span-2">
                        <Label>Pornstar Name</Label>
                        <Input type="text" placeholder="Name" required={true} onChange={(e) => setPornstarName(e.target.value)} />
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                        <Label>Social Media Links</Label>
                        {socialLinks.map((link, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    placeholder="Social Name (e.g. Twitter)"
                                    value={link.name}
                                    onChange={(e) => handleSocialLinkChange(index, 'name', e.target.value)}
                                    className="flex-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                                <input
                                    type="text"
                                    placeholder="URL (e.g. https://twitter.com/username)"
                                    value={link.link}
                                    onChange={(e) => handleSocialLinkChange(index, 'link', e.target.value)}
                                    className="flex-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeSocialLink(index)}
                                    className="p-2 bg-red-50 text-red-500 rounded hover:bg-red-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addSocialLink}
                            className="mt-2 text-blue-500 flex items-center gap-1 hover:text-blue-700"
                        >
                            <Plus size={16} />
                            <span>Add Another Social Link</span>
                        </button>
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                        <Label>Profile Picture URL</Label>
                        <Input
                            type="text"
                            placeholder="https://example.com/images/profile.jpg"
                            onChange={handleProfilePicChange}
                        />

                        {previewUrl && (
                            <div className="mt-3">
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-32 h-32 rounded-md object-cover"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
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

    function EditPornstarModel(data: any) {
        const [pornstarName, setPornstarName] = useState('');
        const [socialLinks, setSocialLinks] = useState<Array<{ name: string, link: string }>>([{ name: '', link: '' }]);
        const [profilePicUrl, setProfilePicUrl] = useState<string>(data.profile_pic || '');
        const [previewUrl, setPreviewUrl] = useState<string | null>(data.profile_pic || null);

        // Parse social links from JSON if they exist
        useEffect(() => {
            if (data.social_links) {
                try {
                    // Check if social_links is already an array (already parsed JSON)
                    if (Array.isArray(data.social_links) && data.social_links.length > 0) {
                        setSocialLinks(data.social_links);
                    }
                    // If it's a string, try to parse it
                    else if (typeof data.social_links === 'string') {
                        const parsedLinks = JSON.parse(data.social_links);

                        if (Array.isArray(parsedLinks) && parsedLinks.length > 0) {
                            setSocialLinks(parsedLinks);
                        } else {
                            setSocialLinks([{ name: '', link: '' }]);
                        }
                    }
                    // If it's an object but not an array
                    else if (typeof data.social_links === 'object') {
                        setSocialLinks([{ name: '', link: '' }]);
                    }
                } catch (error) {
                    // If parsing fails, set a single empty link
                    setSocialLinks([{ name: '', link: '' }]);
                }
            } else {
                setSocialLinks([{ name: '', link: '' }]);
            }
        }, [data.social_links]);

        const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const url = e.target.value;
            setProfilePicUrl(url);
            setPreviewUrl(url);
        };

        const handleSocialLinkChange = (index: number, field: 'name' | 'link', value: string) => {
            const updatedLinks = [...socialLinks];
            updatedLinks[index][field] = value;
            setSocialLinks(updatedLinks);
        };

        const addSocialLink = () => {
            setSocialLinks([...socialLinks, { name: '', link: '' }]);
        };

        const removeSocialLink = (index: number) => {
            if (socialLinks.length > 1) {
                const updatedLinks = [...socialLinks];
                updatedLinks.splice(index, 1);
                setSocialLinks(updatedLinks);
            }
        };

        const handleSave = async (e: React.FormEvent) => {
            e.preventDefault();
            try {
                // Filter out empty social links
                const validSocialLinks = socialLinks.filter(link => link.name.trim() !== '' && link.link.trim() !== '');

                // Create JSON payload
                const payload = {
                    pornstar_id: data.pstar_id,
                    name: pornstarName === '' ? data.name : pornstarName,
                    profile_pic: profilePicUrl === '' ? null : profilePicUrl,
                    social_links: validSocialLinks
                };

                const response = await axios.post('/edit-pornstar', payload, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data.success) {
                    setPornstarName('');
                    setSocialLinks([{ name: '', link: '' }]);
                    setProfilePicUrl('');
                    setPreviewUrl(null);
                    closeModalEdit();
                    fetchPornstars();

                    Swal.fire({
                        title: 'Success',
                        text: 'Pornstar updated successfully!',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    });
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: 'Failed to update pornstar',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            } catch (error) {
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to update pornstar',
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
                    Edit Pornstar
                </h4>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                    <div className="col-span-1 sm:col-span-2">
                        <Label>Pornstar Name</Label>
                        <Input type="text" defaultValue={data.name} placeholder="Name" required={true} onChange={(e) => setPornstarName(e.target.value)} />
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                        <Label>Social Media Links</Label>
                        {socialLinks.map((link, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    placeholder="Social Name (e.g. Twitter)"
                                    value={link.name}
                                    onChange={(e) => handleSocialLinkChange(index, 'name', e.target.value)}
                                    className="flex-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                                <input
                                    type="text"
                                    placeholder="URL (e.g. https://twitter.com/username)"
                                    value={link.link}
                                    onChange={(e) => handleSocialLinkChange(index, 'link', e.target.value)}
                                    className="flex-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeSocialLink(index)}
                                    className="p-2 bg-red-50 text-red-500 rounded hover:bg-red-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addSocialLink}
                            className="mt-2 text-blue-500 flex items-center gap-1 hover:text-blue-700"
                        >
                            <Plus size={16} />
                            <span>Add Another Social Link</span>
                        </button>
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                        <Label>Profile Picture URL</Label>
                        <Input
                            type="text"
                            placeholder="https://example.com/images/profile.jpg"
                            defaultValue={data.profile_pic || ''}
                            onChange={handleProfilePicChange}
                        />

                        {previewUrl && (
                            <div className="mt-3">
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-32 h-32 rounded-md object-cover"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
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
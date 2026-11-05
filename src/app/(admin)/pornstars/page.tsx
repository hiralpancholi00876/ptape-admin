'use client';

import React, { useState } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import axios from '@/utils/axios';
import { getColorFromName } from '@/utils/commonFunc';
import {
  Eye,
  Film,
  Search,
  Plus,
  Pencil,
  Trash,
  Check,
  X,
  LoaderCircle,
  RefreshCcw,
} from 'lucide-react';
import ToggleSwitch from '@/components/form/switch/Switch';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';
import { useEntityList } from '@/hooks/useEntityList';
import Swal from 'sweetalert2';
import { useQueryClient } from '@tanstack/react-query';

type SocialLink = { name: string; link: string };

interface Pornstar {
  pstar_id: number;
  name: string;
  // Stored as JSON; arrives as a string or already parsed depending on the column type.
  social_links: string | SocialLink[] | null;
  video_count: number;
  total_views: number;
  slug: string;
  is_active: number;
  profile_pic: string | null;
}

const EMPTY_LINK: SocialLink = { name: '', link: '' };

const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  compactDisplay: 'short',
});

const getInitials = (name: string) => {
  const names = name.split(' ');
  const initials =
    names.length === 1
      ? names[0].charAt(0)
      : names[0].charAt(0) + names[names.length - 1].charAt(0);
  return initials.toUpperCase();
};

export default function PornstarPage() {
  const {
    searchQuery,
    setSearchQuery,
    items: pornstars,
    error,
    status,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    loadMoreRef,
    deleteItem,
    toggleActive,
  } = useEntityList<Pornstar>({ endpoint: 'pornstars', type: 'pornstar', idKey: 'pstar_id' });
  // null = closed, {} = add, { pornstar } = edit
  const [modal, setModal] = useState<{ pornstar?: Pornstar } | null>(null);

  return (
    <div className="p-4 md:p-6">
      {modal && <PornstarFormModal pornstar={modal.pornstar} onClose={() => setModal(null)} />}

      {/* Page Breadcrumb */}
      <PageBreadcrumb pageTitle="Pornstars" />

      {/* Header with search and add button */}
      <div className="mb-6 flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search pornstars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-10 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <Search
            className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400"
            size={16}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center"
            size="sm"
            onClick={() => refetch()}
            disabled={status === 'pending' || isFetchingNextPage}
          >
            <RefreshCcw
              size={18}
              className={`mr-2 ${status === 'pending' ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button
            className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white shadow-md transition-colors hover:bg-blue-700 hover:shadow-lg"
            size="sm"
            onClick={() => setModal({})}
          >
            <Plus size={18} className="mr-2" />
            Add New Pornstar
          </Button>
        </div>
      </div>

      {/* Error message */}
      {status === 'error' && (
        <div className="mb-4 flex items-center rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <span className="mr-2">⚠️</span>
          {error?.message}
        </div>
      )}

      {/* Loading indicator (Initial) */}
      {status === 'pending' ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        /* Pornstars grid */
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
          {pornstars.length > 0 ? (
            pornstars.map((pornstar, index) => (
              <div
                key={`${pornstar.pstar_id}-${index}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-800"
              >
                {/* Active Status Bar */}
                <div
                  className={`absolute inset-x-0 top-0 h-1 transition-colors duration-300 ${pornstar.is_active ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                />

                <div className="flex flex-grow flex-col items-center p-6">
                  {/* Profile Image */}
                  <div className="relative mb-4">
                    <div className="h-24 w-24 rounded-full bg-white p-1 shadow-sm ring-1 ring-gray-100 transition-transform duration-300 group-hover:scale-105 dark:bg-gray-800 dark:ring-gray-700">
                      {pornstar.profile_pic ? (
                        <img
                          src={pornstar.profile_pic}
                          alt={pornstar.name}
                          className="h-full w-full rounded-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(pornstar.name)}&background=random`;
                          }}
                        />
                      ) : (
                        <div
                          className={`flex h-full w-full items-center justify-center rounded-full text-2xl font-bold text-white ${getColorFromName(pornstar.name)}`}
                        >
                          {getInitials(pornstar.name)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name & Title */}
                  <h3
                    className="mb-1 w-full truncate text-center text-lg font-bold text-gray-900 dark:text-white"
                    title={pornstar.name}
                  >
                    {pornstar.name}
                  </h3>

                  {/* Social Badge */}
                  <div className="mb-4 flex h-6 items-center justify-center">
                    {pornstar.social_links ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-800/30 dark:bg-blue-900/20 dark:text-blue-300">
                        <Check size={10} strokeWidth={3} /> Verified Socials
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-gray-100 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-400">
                        No Socials
                      </span>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="mb-4 grid w-full grid-cols-2 gap-2">
                    <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-gray-50 p-2 dark:border-gray-700/50 dark:bg-gray-700/30">
                      <span className="text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                        Videos
                      </span>
                      <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
                        <Film size={14} className="text-blue-500" />
                        {pornstar.video_count}
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-gray-50 p-2 dark:border-gray-700/50 dark:bg-gray-700/30">
                      <span className="text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                        Views
                      </span>
                      <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
                        <Eye size={14} className="text-indigo-500" />
                        {compactNumber.format(pornstar.total_views)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons Footer */}
                <div className="mt-auto flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-5 py-4 dark:border-gray-700 dark:bg-gray-700/20">
                  <div className="flex items-center gap-2">
                    <button
                      className="group/btn rounded-lg border border-transparent p-2 text-gray-400 transition-all hover:border-blue-100 hover:bg-white hover:text-blue-600 hover:shadow-sm dark:hover:bg-gray-700 dark:hover:text-blue-400"
                      title="Edit Pornstar"
                      onClick={() => setModal({ pornstar })}
                    >
                      <Pencil
                        size={18}
                        className="transition-transform group-hover/btn:scale-110"
                      />
                    </button>

                    <button
                      onClick={() => deleteItem(pornstar.pstar_id)}
                      className="group/btn rounded-lg border border-transparent p-2 text-gray-400 transition-all hover:border-red-100 hover:bg-white hover:text-red-500 hover:shadow-sm dark:hover:bg-gray-700 dark:hover:text-red-400"
                      title="Delete Pornstar"
                    >
                      <Trash size={18} className="transition-transform group-hover/btn:scale-110" />
                    </button>
                  </div>

                  <div className="flex items-center">
                    <ToggleSwitch
                      checked={pornstar.is_active === 1}
                      onChange={(checked) => toggleActive(pornstar.pstar_id, checked)}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-12 dark:border-gray-700 dark:bg-gray-800/50">
              <div className="mb-3 rounded-full bg-gray-100 p-4 dark:bg-gray-700">
                <Search className="text-gray-400" size={32} />
              </div>
              <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">
                No pornstars found
              </h3>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Try adjusting your search or add a new pornstar.
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          )}

          {/* Infinite Scroll Skeletons */}
          {isFetchingNextPage && (
            <>
              {[...Array(5)].map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="flex animate-pulse flex-col items-center rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="mb-3 h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  <div className="mb-2 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
                  <div className="mb-4 h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
                  <div className="mt-auto h-8 w-full rounded bg-gray-100 dark:bg-gray-700"></div>
                </div>
              ))}
            </>
          )}

          {/* Intersection Observer Target */}
          <div ref={loadMoreRef} className="col-span-full flex h-10 w-full justify-center p-4">
            {isFetchingNextPage ? null : hasNextPage ? (
              <span className="text-sm text-gray-400">Scroll for more...</span>
            ) : pornstars.length > 0 ? (
              <span className="text-sm text-gray-400">No more pornstars</span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function PornstarFormModal({ pornstar, onClose }: { pornstar?: Pornstar; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(pornstar?.name ?? '');
  const [profilePic, setProfilePic] = useState(pornstar?.profile_pic ?? '');
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(() => {
    try {
      const raw = pornstar?.social_links;
      const links = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(links) && links.length > 0 ? links : [EMPTY_LINK];
    } catch {
      return [EMPTY_LINK];
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const action = pornstar ? 'update' : 'add';

  const updateSocialLink = (index: number, field: keyof SocialLink, value: string) => {
    setSocialLinks((links) =>
      links.map((link, i) => (i === index ? { ...link, [field]: value } : link))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        profile_pic: profilePic || null,
        social_links: socialLinks.filter((link) => link.name.trim() && link.link.trim()),
      };
      const response = pornstar
        ? await axios.post('/edit-pornstar', { pornstar_id: pornstar.pstar_id, ...payload })
        : await axios.post('/add-pornstar', payload);
      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      queryClient.invalidateQueries({ queryKey: ['pornstars'] });
      onClose();
      Swal.fire({
        title: 'Success',
        text: `Pornstar ${action === 'add' ? 'added' : 'updated'} successfully!`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({ title: 'Error', text: `Failed to ${action} pornstar`, icon: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} className="max-w-[584px] rounded-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h4 className="text-xl font-bold text-gray-900 dark:text-white">
          {pornstar ? 'Edit Pornstar' : 'New Pornstar'}
        </h4>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <span className="sr-only">Close</span>
          <X className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <Label>Pornstar Name</Label>
          <Input
            type="text"
            placeholder="e.g. Riley Reid"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <Label>Profile Picture URL</Label>
          <Input
            type="text"
            placeholder="https://example.com/images/profile.jpg"
            value={profilePic}
            onChange={(e) => setProfilePic(e.target.value)}
          />
          {profilePic && (
            <div className="mt-3">
              <img
                key={profilePic}
                src={profilePic}
                alt="Preview"
                className="h-20 w-20 rounded-full border-2 border-gray-100 object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        <div>
          <Label>Social Media Links</Label>
          <div className="mt-1 space-y-2">
            {socialLinks.map((link, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Platform (e.g. X)"
                  value={link.name}
                  onChange={(e) => updateSocialLink(index, 'name', e.target.value)}
                  className="w-1/3 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="URL"
                  value={link.link}
                  onChange={(e) => updateSocialLink(index, 'link', e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() =>
                    socialLinks.length > 1 &&
                    setSocialLinks(socialLinks.filter((_, i) => i !== index))
                  }
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSocialLinks([...socialLinks, EMPTY_LINK])}
            className="mt-3 flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <Plus size={16} />
            Add Another Link
          </button>
        </div>

        <div className="mt-8 flex w-full items-center justify-end gap-3">
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            type="submit"
            disabled={isSubmitting}
            className="min-w-[100px] bg-blue-600 text-white hover:bg-blue-700"
          >
            {isSubmitting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : pornstar ? (
              'Save Changes'
            ) : (
              'Create Pornstar'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

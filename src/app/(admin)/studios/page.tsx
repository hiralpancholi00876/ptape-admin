'use client';

import React, { useState } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import axios from '@/utils/axios';
import { Eye, Globe, Search, Plus, Pencil, Trash, LoaderCircle, RefreshCcw, X } from 'lucide-react';
import ToggleSwitch from '@/components/form/switch/Switch';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';
import { useEntityList } from '@/hooks/useEntityList';
import Swal from 'sweetalert2';
import { useQueryClient } from '@tanstack/react-query';

interface Studio {
  studio_id: number;
  name: string;
  website: string | null;
  video_count: number;
  total_views: number;
  slug: string;
  is_active: number;
}

const websiteUrl = (website: string) =>
  website.startsWith('http') ? website : `https://${website}`;

const websiteHost = (website: string) => {
  try {
    return new URL(websiteUrl(website)).hostname.replace('www.', '');
  } catch {
    return 'Website';
  }
};

export default function StudiosPage() {
  const {
    searchQuery,
    setSearchQuery,
    items: studios,
    error,
    status,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    loadMoreRef,
    deleteItem,
    toggleActive,
  } = useEntityList<Studio>({ endpoint: 'studios', type: 'studio', idKey: 'studio_id' });
  // null = closed, {} = add, { studio } = edit
  const [modal, setModal] = useState<{ studio?: Studio } | null>(null);

  return (
    <div className="p-4 md:p-6">
      {modal && <StudioFormModal studio={modal.studio} onClose={() => setModal(null)} />}

      {/* Page Breadcrumb */}
      <PageBreadcrumb pageTitle="Studios" />

      {/* Header with search and add button */}
      <div className="mb-6 flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search studios..."
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
            Add New Studio
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
        /* Studios grid */
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
          {studios.length > 0 ? (
            studios.map((studio, index) => (
              <div
                key={`${studio.studio_id}-${index}`}
                className="group overflow-hidden rounded-xl border border-gray-100 bg-white text-center shadow-sm transition-all duration-300 hover:border-blue-100 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex flex-col items-center p-5">
                  <h3
                    className="mb-2 w-full truncate text-lg font-bold text-gray-800 dark:text-white"
                    title={studio.name}
                  >
                    {studio.name}
                  </h3>

                  <div className="mb-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <span className="mr-1 font-medium">{studio.video_count}</span> videos
                  </div>

                  <div className="mb-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Eye size={14} className="mr-1.5" />
                    <span>{studio.total_views.toLocaleString()}</span>
                  </div>

                  <div className="mb-4 flex h-6 items-center text-sm text-gray-500 dark:text-gray-400">
                    {studio.website ? (
                      <a
                        href={websiteUrl(studio.website)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex max-w-[150px] items-center gap-1 truncate text-blue-500 hover:underline"
                      >
                        <Globe size={12} />
                        {websiteHost(studio.website)}
                      </a>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-300 dark:text-gray-600">
                        <Globe size={12} /> No Website
                      </span>
                    )}
                  </div>

                  <div className="mt-auto flex w-full items-center justify-between border-t border-gray-50 pt-4 dark:border-gray-700">
                    <div className="flex space-x-2">
                      <button
                        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-gray-700"
                        title="Edit"
                        onClick={() => setModal({ studio })}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => deleteItem(studio.studio_id)}
                        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-gray-400 dark:hover:bg-gray-700"
                        title="Delete"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                    <ToggleSwitch
                      checked={studio.is_active === 1}
                      onChange={(checked) => toggleActive(studio.studio_id, checked)}
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
                No studios found
              </h3>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Try adjusting your search or add a new studio.
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
                  <div className="mb-3 h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
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
            ) : studios.length > 0 ? (
              <span className="text-sm text-gray-400">No more studios</span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function StudioFormModal({ studio, onClose }: { studio?: Studio; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(studio?.name ?? '');
  const [website, setWebsite] = useState(studio?.website ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const action = studio ? 'update' : 'add';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { name, website: website || null };
      const response = studio
        ? await axios.post('/edit-studio', { studio_id: studio.studio_id, ...payload })
        : await axios.post('/add-studio', payload);
      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      queryClient.invalidateQueries({ queryKey: ['studios'] });
      onClose();
      Swal.fire({
        title: 'Success',
        text: `Studio ${action === 'add' ? 'added' : 'updated'} successfully!`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({ title: 'Error', text: `Failed to ${action} studio`, icon: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} className="max-w-[480px] rounded-2xl p-6">
      <form onSubmit={handleSave}>
        <div className="mb-6 flex items-center justify-between">
          <h4 className="text-xl font-bold text-gray-900 dark:text-white">
            {studio ? 'Edit Studio' : 'New Studio'}
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

        <div className="space-y-4">
          <div>
            <Label>Studio Name</Label>
            <Input
              type="text"
              placeholder="e.g. Brazzers"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label>
              Website URL <span className="ml-1 text-xs font-normal text-gray-400">(Optional)</span>
            </Label>
            <Input
              type="text"
              placeholder="https://example.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
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
            ) : studio ? (
              'Save Changes'
            ) : (
              'Create Studio'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

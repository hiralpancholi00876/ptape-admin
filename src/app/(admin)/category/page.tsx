'use client';

import React, { useState, useEffect } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import axios from '@/utils/axios';
import { Search, Plus, Film, Pencil, Trash2, Loader2, RefreshCcw } from 'lucide-react';
import ToggleSwitch from '@/components/form/switch/Switch';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';
import { useModal } from '@/hooks/useModal';
import Swal from 'sweetalert2';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';

interface Category {
  category_id: number;
  name: string;
  video_count: number;
  slug: string;
  is_active: number;
}

// Generate a color based on name
const getColorFromName = (name: string) => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function CategoryPage() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const queryClient = useQueryClient();
  const { ref, inView } = useInView();

  const { isOpen, openModal, closeModal } = useModal();
  const { isOpen: isOpenEdit, openModal: openModalEdit, closeModal: closeModalEdit } = useModal();
  const [editData, setEditData] = useState<{ category_id: number | null; name: string }>({
    category_id: null,
    name: '',
  });

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Categories Function for Infinite Query
  const fetchCategories = async ({ pageParam = 1 }: { pageParam?: number }) => {
    const response = await axios.get('/categories', {
      params: {
        page: pageParam,
        limit: 20,
        search: debouncedSearch,
      },
    });

    let categoriesData: Category[] = [];
    let hasMore = false;

    if (response.data.success) {
      if (response.data.data && Array.isArray(response.data.data)) {
        categoriesData = response.data.data;
        if (response.data.pagination) {
          hasMore = pageParam < response.data.pagination.total_pages;
        } else {
          hasMore = categoriesData.length === 20;
        }
      }
    } else {
      // throw new Error(response.data.message || "Failed to fetch");
      // Handle gracefully if API structure differs slightly, but typically we want to throw to let React Query handle error state
    }

    return {
      data: categoriesData,
      nextCursor: hasMore ? pageParam + 1 : undefined,
      hasMore,
    };
  };

  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, status, refetch } =
    useInfiniteQuery({
      queryKey: ['categories', debouncedSearch],
      queryFn: fetchCategories,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: 1,
    });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      return axios.post(`/delete`, {
        id: categoryId,
        type: 'category',
      });
    },
    onSuccess: () => {
      Swal.fire('Deleted!', 'Category has been deleted.', 'success');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: () => {
      Swal.fire('Error', 'Failed to delete category', 'error');
    },
  });

  const handleDeleteCategory = async (categoryId: number) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(categoryId);
      }
    });
  };

  // Toggle Active Mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return axios.post(`/active-inactive`, {
        id,
        type: 'category',
        action: isActive,
      });
    },
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ['categories', debouncedSearch] });
      const previousData = queryClient.getQueryData(['categories', debouncedSearch]);

      queryClient.setQueryData(['categories', debouncedSearch], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((category: Category) =>
              category.category_id === id ? { ...category, is_active: isActive ? 1 : 0 } : category
            ),
          })),
        };
      });
      return { previousData };
    },
    onError: (err, newTodo, context: any) => {
      queryClient.setQueryData(['categories', debouncedSearch], context.previousData);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Something went wrong!',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
    },
  });

  const handleToggle = (category_id: number, isActive: boolean) => {
    toggleMutation.mutate({ id: category_id, isActive });
  };

  const categories = data?.pages.flatMap((page) => page.data) || [];

  return (
    <div className="p-4 md:p-6">
      {isOpen && (
        <AddCategoryModal
          onClose={() => {
            closeModal();
            queryClient.invalidateQueries({ queryKey: ['categories'] });
          }}
        />
      )}
      {isOpenEdit && (
        <EditCategoryModal
          category_id={editData.category_id}
          name={editData.name}
          onClose={() => {
            closeModalEdit();
            queryClient.invalidateQueries({ queryKey: ['categories'] });
          }}
        />
      )}

      {/* Page Breadcrumb */}
      <PageBreadcrumb pageTitle="Categories" />

      {/* Header with search and add button */}
      <div className="mb-6 flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search categories..."
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
            onClick={openModal}
          >
            <Plus size={18} className="mr-2" />
            Add New Category
          </Button>
        </div>
      </div>

      {/* Error message */}
      {status === 'error' && (
        <div className="mb-4 flex items-center rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <span className="mr-2">⚠️</span>
          {(error as Error)?.message || 'An error occurred'}
        </div>
      )}

      {/* Loading indicator (Initial) */}
      {status === 'pending' ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        /* Categories grid */
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
          {categories.length > 0 ? (
            categories.map((category, index) => (
              <div
                key={`${category.category_id}-${index}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-800"
              >
                {/* Active Status Bar */}
                <div
                  className={`absolute inset-x-0 top-0 h-1 transition-colors duration-300 ${category.is_active ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                />

                <div className="flex flex-grow flex-col items-center p-6">
                  {/* Icon / Initial */}
                  <div
                    className={`mb-4 flex h-16 w-16 transform items-center justify-center rounded-2xl text-3xl font-bold text-white shadow-md transition-transform duration-300 group-hover:rotate-6 ${getColorFromName(category.name)}`}
                  >
                    {category.name.charAt(0).toUpperCase()}
                  </div>

                  <h3
                    className="mb-1 w-full truncate text-center text-lg font-bold text-gray-900 dark:text-white"
                    title={category.name}
                  >
                    {category.name}
                  </h3>

                  {/* Stats Badge */}
                  <div className="mt-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-300">
                      <Film size={14} className="text-blue-500" />
                      {category.video_count}{' '}
                      <span className="ml-0.5 text-xs text-gray-400 uppercase">Videos</span>
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-auto flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-5 py-4 dark:border-gray-700 dark:bg-gray-700/20">
                  <div className="flex items-center gap-2">
                    <button
                      className="group/btn rounded-lg border border-transparent p-2 text-gray-400 transition-all hover:border-blue-100 hover:bg-white hover:text-blue-600 hover:shadow-sm dark:hover:bg-gray-700 dark:hover:text-blue-400"
                      title="Edit Category"
                      onClick={() => {
                        setEditData({
                          category_id: category.category_id,
                          name: category.name,
                        });
                        openModalEdit();
                      }}
                    >
                      <Pencil
                        size={18}
                        className="transition-transform group-hover/btn:scale-110"
                      />
                    </button>

                    <button
                      onClick={() => handleDeleteCategory(category.category_id)}
                      className="group/btn rounded-lg border border-transparent p-2 text-gray-400 transition-all hover:border-red-100 hover:bg-white hover:text-red-500 hover:shadow-sm dark:hover:bg-gray-700 dark:hover:text-red-400"
                      title="Delete Category"
                    >
                      <Trash2
                        size={18}
                        className="transition-transform group-hover/btn:scale-110"
                      />
                    </button>
                  </div>
                  <ToggleSwitch
                    label=""
                    checked={category.is_active === 1}
                    onChange={(checked) => handleToggle(category.category_id, checked)}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-12 dark:border-gray-700 dark:bg-gray-800/50">
              <div className="mb-3 rounded-full bg-gray-100 p-4 dark:bg-gray-700">
                <Search className="text-gray-400" size={32} />
              </div>
              <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">
                No categories found
              </h3>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Try adjusting your search or add a new category.
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
                  <div className="mb-4 h-16 w-16 rounded-2xl bg-gray-200 dark:bg-gray-700"></div>
                  <div className="mb-2 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
                  <div className="mb-4 h-6 w-1/3 rounded bg-gray-200 dark:bg-gray-700"></div>
                  <div className="mt-auto h-8 w-full rounded bg-gray-100 dark:bg-gray-700"></div>
                </div>
              ))}
            </>
          )}

          {/* Intersection Observer Target */}
          <div ref={ref} className="col-span-full flex h-10 w-full justify-center p-4">
            {isFetchingNextPage ? null : hasNextPage ? (
              <span className="text-sm text-gray-400">Scroll for more...</span>
            ) : categories.length > 0 ? (
              <span className="text-sm text-gray-400">No more categories</span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );

  function AddCategoryModal({ onClose }: { onClose: () => void }) {
    const [categoryName, setCategoryName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        const payload = {
          name: categoryName,
        };

        const response = await axios.post('/add-category', payload);

        if (response.data.success) {
          onClose();
          Swal.fire({
            title: 'Success',
            text: 'Category added successfully!',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
          });
        } else {
          Swal.fire({
            title: 'Error',
            text: 'Failed to add category',
            icon: 'error',
          });
        }
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: 'Failed to add category',
          icon: 'error',
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <Modal isOpen={true} onClose={onClose} className="max-w-[480px] rounded-2xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h4 className="text-xl font-bold text-gray-900 dark:text-white">New Category</h4>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form className="" onSubmit={handleSave}>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <div className="col-span-1 sm:col-span-2">
              <Label>Category Name</Label>
              <Input
                type="text"
                placeholder="e.g. Amateur"
                required={true}
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
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
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>
    );
  }

  function EditCategoryModal({
    category_id,
    name,
    onClose,
  }: {
    category_id: number | null;
    name: string;
    onClose: () => void;
  }) {
    const [categoryName, setCategoryName] = useState(name);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
      setCategoryName(name);
    }, [name]);

    const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        const payload = {
          category_id: category_id,
          name: categoryName,
        };

        const response = await axios.post('/edit-category', payload);

        if (response.data.success) {
          onClose();
          Swal.fire({
            title: 'Success',
            text: 'Category updated successfully!',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
          });
        } else {
          Swal.fire({
            title: 'Error',
            text: 'Failed to update category',
            icon: 'error',
          });
        }
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: 'Failed to update category',
          icon: 'error',
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <Modal isOpen={true} onClose={onClose} className="max-w-[480px] rounded-2xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h4 className="text-xl font-bold text-gray-900 dark:text-white">Edit Category</h4>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form className="" onSubmit={handleSave}>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <div className="col-span-1 sm:col-span-2">
              <Label>Category Name</Label>
              <Input
                type="text"
                placeholder="e.g. Amateur"
                defaultValue={name}
                required={true}
                onChange={(e) => setCategoryName(e.target.value)}
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
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    );
  }
}

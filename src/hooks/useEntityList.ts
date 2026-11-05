'use client';
import { useEffect, useState } from 'react';
import { InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import Swal from 'sweetalert2';
import axios from '@/utils/axios';

const PAGE_SIZE = 20;

type Page<T> = { data: T[]; nextCursor?: number };

interface EntityListOptions<T> {
  endpoint: 'categories' | 'studios' | 'pornstars';
  type: 'category' | 'studio' | 'pornstar';
  idKey: keyof T;
}

// Searchable, infinitely scrolling list of categories/studios/pornstars with delete and active toggling.
export function useEntityList<T extends { is_active: number }>({
  endpoint,
  type,
  idKey,
}: EntityListOptions<T>) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { ref: loadMoreRef, inView } = useInView();
  const queryKey = [endpoint, debouncedSearch];
  const label = type.charAt(0).toUpperCase() + type.slice(1);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data, error, status, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey,
      queryFn: async ({ pageParam }): Promise<Page<T>> => {
        const response = await axios.get(`/${endpoint}`, {
          params: { page: pageParam, limit: PAGE_SIZE, search: debouncedSearch },
        });
        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to fetch');
        }

        const items: T[] = Array.isArray(response.data.data) ? response.data.data : [];
        return { data: items, nextCursor: items.length === PAGE_SIZE ? pageParam + 1 : undefined };
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: 1,
    });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axios.post('/delete', { id, type }),
    onSuccess: () => {
      Swal.fire('Deleted!', `${label} has been deleted.`, 'success');
      queryClient.invalidateQueries({ queryKey: [endpoint] });
    },
    onError: () => {
      Swal.fire('Error', `Failed to delete ${type}`, 'error');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      axios.post('/active-inactive', { id, type, action: isActive }),
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData<InfiniteData<Page<T>>>(
        queryKey,
        (old) =>
          old && {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((item) =>
                item[idKey] === id ? { ...item, is_active: isActive ? 1 : 0 } : item
              ),
            })),
          }
      );
      return { previousData };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousData);
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

  const deleteItem = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    });
    if (result.isConfirmed) {
      deleteMutation.mutate(id);
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    items: data?.pages.flatMap((page) => page.data) ?? [],
    error,
    status,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    loadMoreRef,
    deleteItem,
    toggleActive: (id: number, isActive: boolean) => toggleMutation.mutate({ id, isActive }),
  };
}

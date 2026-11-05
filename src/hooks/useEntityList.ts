import { useEffect, useState } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import { toast } from 'react-hot-toast'
import { api, type ApiResponse } from '../lib/api'
import { confirm } from '../stores/confirmStore'
import { useDebouncedValue } from './useDebouncedValue'

const PAGE_SIZE = 20

type Page<T> = { data: T[]; nextCursor?: number }

interface EntityListOptions<T> {
  endpoint: 'categories' | 'studios' | 'pornstars'
  type: 'category' | 'studio' | 'pornstar'
  idKey: keyof T
}

// Searchable, infinitely scrolling list of categories/studios/pornstars with delete and active toggling.
export function useEntityList<T extends { is_active: number; name: string }>({
  endpoint,
  type,
  idKey,
}: EntityListOptions<T>) {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebouncedValue(searchQuery, 500)
  const { ref: loadMoreRef, inView } = useInView()
  const queryKey = [endpoint, debouncedSearch]
  const label = type.charAt(0).toUpperCase() + type.slice(1)

  const { data, error, status, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey,
      queryFn: async ({ pageParam }): Promise<Page<T>> => {
        const response = await api.get<ApiResponse<T[]>>(`/${endpoint}`, {
          params: { page: pageParam, limit: PAGE_SIZE, search: debouncedSearch },
        })
        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to fetch')
        }

        const items = Array.isArray(response.data.data) ? response.data.data : []
        return { data: items, nextCursor: items.length === PAGE_SIZE ? pageParam + 1 : undefined }
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: 1,
    })

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      api.post('/active-inactive', { id, type, action: isActive }),
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey })
      const previousData = queryClient.getQueryData(queryKey)

      queryClient.setQueryData<InfiniteData<Page<T>>>(
        queryKey,
        (old) =>
          old && {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((item) =>
                item[idKey] === id ? { ...item, is_active: isActive ? 1 : 0 } : item,
              ),
            })),
          },
      )
      return { previousData }
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousData)
      toast.error(`Failed to update ${type} status`)
    },
  })

  const deleteItem = (item: T) =>
    confirm({
      title: `Delete ${type}`,
      message: `Delete “${item.name}”? You won't be able to revert this.`,
      onConfirm: async () => {
        try {
          await api.post('/delete', { id: item[idKey], type })
          toast.success(`${label} deleted`)
          queryClient.invalidateQueries({ queryKey: [endpoint] })
          queryClient.invalidateQueries({ queryKey: ['select-options', endpoint] })
        } catch {
          toast.error(`Failed to delete ${type}`)
        }
      },
    })

  return {
    searchQuery,
    setSearchQuery,
    items: data?.pages.flatMap((page) => page.data) ?? [],
    error,
    status,
    refetch,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    loadMoreRef,
    deleteItem,
    toggleActive: (id: number, isActive: boolean) => toggleMutation.mutate({ id, isActive }),
  }
}

export type EntityList<T> = ReturnType<typeof useEntityList<T & { is_active: number; name: string }>>

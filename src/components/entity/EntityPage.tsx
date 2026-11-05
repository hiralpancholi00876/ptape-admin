import { Fragment, type ReactNode } from 'react'
import { AlertTriangle, Plus, RefreshCcw, type LucideIcon } from 'lucide-react'
import type { EntityList } from '../../hooks/useEntityList'
import { Button, EmptyState, SearchInput, Spinner } from '../ui'

interface EntityPageProps<T> {
  noun: string
  plural: string
  icon: LucideIcon
  list: EntityList<T>
  onAdd: () => void
  getKey: (item: T) => number
  renderCard: (item: T) => ReactNode
  // Modals and other overlays owned by the page.
  children?: ReactNode
}

export function EntityPage<T>({
  noun,
  plural,
  icon,
  list,
  onAdd,
  getKey,
  renderCard,
  children,
}: EntityPageProps<T>) {
  const {
    searchQuery,
    setSearchQuery,
    items,
    error,
    status,
    refetch,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    loadMoreRef,
  } = list
  const addButton = (
    <Button leftIcon={<Plus className="size-4" />} onClick={onAdd}>
      Add {noun}
    </Button>
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-surface-700 bg-surface-850 p-4 sm:flex-row sm:items-center">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={`Search ${plural}…`}
          className="flex-1"
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={status === 'pending' || isRefetching}
            leftIcon={
              <RefreshCcw className={`size-4 ${isRefetching ? 'animate-spin' : ''}`} />
            }
          >
            Refresh
          </Button>
          {addButton}
        </div>
      </div>

      {status === 'error' && (
        <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="size-4 shrink-0" />
          {error?.message || 'An error occurred'}
        </div>
      )}

      {status === 'pending' ? (
        <Spinner label={`Loading ${plural}…`} />
      ) : items.length === 0 ? (
        status === 'success' && (
          <EmptyState
            icon={icon}
            title={`No ${plural} found`}
            description={
              searchQuery
                ? `Nothing matches “${searchQuery}”. Try a different search.`
                : `Add a ${noun.toLowerCase()} to get started.`
            }
            action={
              searchQuery ? (
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear search
                </Button>
              ) : (
                addButton
              )
            }
          />
        )
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {/* Offset paging can repeat a row across pages, so the index is part of the key. */}
          {items.map((item, index) => (
            <Fragment key={`${getKey(item)}-${index}`}>{renderCard(item)}</Fragment>
          ))}

          {isFetchingNextPage &&
            Array.from({ length: 5 }, (_, i) => (
              <div
                key={`skeleton-${i}`}
                className="h-56 animate-pulse rounded-2xl border border-surface-700 bg-surface-850"
              />
            ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {status === 'success' && items.length > 0 && (
        <div ref={loadMoreRef} className="flex h-10 items-center justify-center text-sm text-zinc-500">
          {isFetchingNextPage ? null : hasNextPage ? 'Scroll for more…' : `No more ${plural}`}
        </div>
      )}

      {children}
    </div>
  )
}

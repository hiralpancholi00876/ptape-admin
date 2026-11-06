import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock, CloudUpload, Eye, EyeOff, Film, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { PublishVideosResult, VideoListItem, VideoListPage } from '../../types'
import { api, type ApiResponse } from '../../lib/api'
import { compactNumber, formatDuration, formatNumber, timeAgo } from '../../lib/format'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { confirm } from '../../stores/confirmStore'
import { useUiStore } from '../../stores/uiStore'
import {
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  FilterDropdown,
  Pagination,
  SearchInput,
  SelectCheck,
  Switch,
  Tabs,
} from '../../components/ui'

type StatusFilter = 'all' | 'active' | 'hidden'

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Published' },
  { value: 'hidden', label: 'Hidden' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'views', label: 'Most viewed' },
  { value: 'title', label: 'Title A–Z' },
]

interface VideoPage {
  videos: VideoListItem[]
  totalPages: number
  total: number | null
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))

// Plain-language account of what each stage of a publish did, for the toast.
function describePublish({ database, redis, cloudflare }: PublishVideosResult) {
  if (database.status !== 'ok') {
    const reason = database.error ? `: ${database.error}` : ''
    return { ok: false, text: `Publishing failed${reason}. Check the list, then try again.` }
  }

  const published = database.published ?? 0
  const headline =
    published > 0
      ? `Published ${formatNumber(published)} ${published === 1 ? 'video' : 'videos'}`
      : 'No unpublished videos to publish'
  const redisText =
    redis.status === 'ok'
      ? `Redis cache cleared (${formatNumber(redis.deleted ?? 0)} ${redis.deleted === 1 ? 'key' : 'keys'})`
      : redis.status === 'failed'
        ? `Redis failed (${redis.error})`
        : 'Redis skipped'
  const cloudflareText =
    cloudflare.status === 'ok'
      ? 'Cloudflare cache purged'
      : cloudflare.status === 'failed'
        ? `Cloudflare failed (${cloudflare.error})`
        : 'Cloudflare skipped'

  if (redis.status === 'ok' && cloudflare.status === 'ok') {
    return { ok: true, text: `${headline}. ${redisText}. ${cloudflareText}.` }
  }
  const outcome = published > 0 ? `${headline} successfully, but` : `${headline}, and`
  return {
    ok: false,
    text: `${outcome} clearing the website cache failed. ${redisText}. ${cloudflareText}. Click Publish again to retry the cache clearing.`,
  }
}

export function VideoList() {
  const queryClient = useQueryClient()
  const location = useLocation()
  const setVideoListSearch = useUiStore((state) => state.setVideoListSearch)
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const page = Math.max(1, Number(params.get('page')) || 1)
  const statusParam = params.get('status')
  const status: StatusFilter = statusParam === 'active' || statusParam === 'hidden' ? statusParam : 'all'
  const sortParam = params.get('sort')
  const sort = SORT_OPTIONS.some((o) => o.value === sortParam) ? sortParam! : 'newest'
  const debouncedQ = useDebouncedValue(q, 400)
  const [selected, setSelected] = useState<number[]>([])
  const [publishing, setPublishing] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const queryKey = ['videos', page, debouncedQ, status, sort]

  // Remember this view so "Back to Videos" returns to the same search, filters and page.
  useEffect(() => setVideoListSearch(location.search), [location.search, setVideoListSearch])

  // "/" jumps to search from anywhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || isTyping(e.target)) return
      e.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const { data, isPending, isError, isPlaceholderData } = useQuery({
    queryKey,
    queryFn: async (): Promise<VideoPage> => {
      const { data } = await api.get<ApiResponse<VideoListPage>>('/videos', {
        params: {
          page,
          search: debouncedQ || undefined,
          status: status === 'all' ? undefined : status,
          sort: sort === 'newest' ? undefined : sort,
        },
      })
      const pagination = data.data?.pagination
      if (!data.success || !pagination) return { videos: [], totalPages: 1, total: 0 }
      return { videos: data.data.videos, totalPages: pagination.totalPages || 1, total: pagination.total ?? null }
    },
    placeholderData: keepPreviousData,
  })

  const videos = data?.videos ?? []
  const totalPages = data?.totalPages ?? 1
  const total = data?.total
  // The previous page stays on screen while the next one loads.
  const isSwitching = isPlaceholderData
  const hasFilters = Boolean(q) || status !== 'all'
  const allSelected = videos.length > 0 && videos.every((v) => selected.includes(v.video_id))

  // Filters replace the history entry; paging pushes one so Back steps through pages.
  const updateParams = (
    changes: Record<string, string | null>,
    { push = false, flushSync = false }: { push?: boolean; flushSync?: boolean } = {},
  ) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParams(next, { replace: !push, flushSync })
    setSelected([])
  }

  const changePage = (next: number) => {
    updateParams({ page: next > 1 ? String(next) : null }, { push: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const patchVideos = (update: (videos: VideoListItem[]) => VideoListItem[]) =>
    queryClient.setQueryData<VideoPage>(queryKey, (old) => old && { ...old, videos: update(old.videos) })

  const patchVideo = (videoId: number, changes: Partial<VideoListItem>) =>
    patchVideos((list) => list.map((v) => (v.video_id === videoId ? { ...v, ...changes } : v)))

  const toggleSelect = (videoId: number) =>
    setSelected((prev) => (prev.includes(videoId) ? prev.filter((id) => id !== videoId) : [...prev, videoId]))

  const removeVideos = (ids: number[]) => {
    patchVideos((list) => list.filter((v) => !ids.includes(v.video_id)))
    // Refetch so the page fills back up from the next one.
    queryClient.invalidateQueries({ queryKey: ['videos'] })
  }

  const handleDelete = (video: VideoListItem) =>
    confirm({
      title: 'Delete Video?',
      message: `Delete “${video.title}”? This can’t be undone.`,
      confirmLabel: 'Delete Video',
      onConfirm: async () => {
        try {
          await api.post('/delete', { id: video.video_id, type: 'video' })
          removeVideos([video.video_id])
          toast.success('Video deleted')
        } catch {
          toast.error('Failed to delete the video. Try again.')
        }
      },
    })

  const handleBulkDelete = () =>
    confirm({
      title: `Delete ${selected.length} Videos?`,
      message: `Delete ${selected.length} selected videos? This can’t be undone.`,
      confirmLabel: 'Delete Videos',
      onConfirm: async () => {
        const ids = [...selected]
        const results = await Promise.allSettled(ids.map((id) => api.post('/delete', { id, type: 'video' })))
        const deleted = ids.filter((_, i) => results[i].status === 'fulfilled')
        removeVideos(deleted)
        setSelected([])
        if (deleted.length === ids.length) {
          toast.success(`${deleted.length} videos deleted`)
        } else {
          toast.error(`${ids.length - deleted.length} of ${ids.length} videos couldn’t be deleted. Try those again.`)
        }
      },
    })

  const setActive = async (video: VideoListItem, isActive: boolean) => {
    patchVideo(video.video_id, { is_active: isActive ? 1 : 0 })
    try {
      await api.post('/active-inactive', { id: video.video_id, type: 'video', action: isActive })
    } catch {
      patchVideo(video.video_id, { is_active: video.is_active })
      toast.error('Failed to update the video’s visibility. Try again.')
    }
  }

  const bulkSetActive = async (isActive: boolean) => {
    const targets = videos.filter((v) => selected.includes(v.video_id) && v.is_active !== (isActive ? 1 : 0))
    setSelected([])
    if (!targets.length) return
    const results = await Promise.allSettled(
      targets.map((v) => api.post('/active-inactive', { id: v.video_id, type: 'video', action: isActive })),
    )
    const done = targets.filter((_, i) => results[i].status === 'fulfilled').map((v) => v.video_id)
    patchVideos((list) => list.map((v) => (done.includes(v.video_id) ? { ...v, is_active: isActive ? 1 : 0 } : v)))
    queryClient.invalidateQueries({ queryKey: ['videos'] })
    if (done.length === targets.length) {
      toast.success(`${done.length} ${done.length === 1 ? 'video' : 'videos'} ${isActive ? 'published' : 'hidden'}`)
    } else {
      toast.error(`${targets.length - done.length} of ${targets.length} videos couldn’t be updated. Try those again.`)
    }
  }

  // Publishes every hidden video across all pages, then clears the website's Redis and Cloudflare caches.
  const publishAll = async () => {
    setPublishing(true)
    try {
      // The cache stages run after the database commit, so allow longer than the default 30s (the server stops at 50s).
      const { data } = await api.post<ApiResponse<PublishVideosResult>>('/publish-videos', undefined, {
        timeout: 45000,
      })
      if (!data.data?.database) throw new Error('Unexpected response')
      const { ok, text } = describePublish(data.data)
      if (ok) toast.success(text, { duration: 6000 })
      else toast.error(text, { duration: 12000 })
    } catch {
      toast.error('Couldn’t confirm the publish. Check the list, then try again.')
    } finally {
      setPublishing(false)
      // Refetch even after a failure: videos may have been published before a cache stage failed.
      queryClient.invalidateQueries({ queryKey: ['videos'] })
    }
  }

  const confirmPublishAll = () =>
    confirm({
      title: 'Publish All Hidden Videos?',
      message:
        'Every hidden video, on all pages, goes live now. Each upload date is replaced with a backdated time ' +
        '(newest first, 1–5 minutes apart) and the original dates can’t be restored. The website cache ' +
        '(Redis and Cloudflare) is then cleared. If nothing is hidden, only the cache is cleared.',
      confirmLabel: 'Publish Videos',
      tone: 'primary',
      onConfirm: publishAll,
    })

  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-col gap-3 rounded-2xl border border-surface-700 bg-surface-850 p-3 lg:flex-row lg:items-center">
        <SearchInput
          inputRef={searchRef}
          value={q}
          // The input reads from the URL, so the update must land synchronously or typing lags.
          onChange={(value) => updateParams({ q: value || null, page: null }, { flushSync: true })}
          placeholder="Search title, slug, studio or pornstar…"
          shortcut="/"
          className="flex-1"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            label="Visibility"
            value={status}
            onChange={(value) => updateParams({ status: value === 'all' ? null : value, page: null })}
            options={STATUS_TABS}
          />
          <FilterDropdown
            value={sort}
            onChange={(value) => updateParams({ sort: value === 'newest' ? null : value, page: null })}
            options={SORT_OPTIONS}
            className="w-40"
          />
          <Button
            variant="secondary"
            onClick={confirmPublishAll}
            loading={publishing}
            leftIcon={<CloudUpload className="size-4" />}
            title="Publish every hidden video and clear the website cache"
          >
            Publish
          </Button>
          <ButtonLink to="/video/add" leftIcon={<Plus className="size-4" />}>
            Add Video
          </ButtonLink>
        </div>
      </div>

      {!isPending && videos.length > 0 && (
        <div className="flex items-center justify-between gap-3 px-1 text-sm text-zinc-500">
          <label className="flex cursor-pointer items-center gap-2 select-none hover:text-zinc-300">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = selected.length > 0 && !allSelected
              }}
              onChange={() => setSelected(allSelected ? [] : videos.map((v) => v.video_id))}
              className="size-4 rounded"
            />
            Select page
          </label>
          {total != null && (
            <p className="tabular-nums">
              {formatNumber(total)} {total === 1 ? 'video' : 'videos'}
              {hasFilters && ' found'}
            </p>
          )}
        </div>
      )}

      {isPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-surface-700 bg-surface-850 p-3">
              <div className="aspect-video rounded-xl bg-surface-750" />
              <div className="mt-3 h-4 w-full rounded bg-surface-750" />
              <div className="mt-2 h-4 w-2/3 rounded bg-surface-750" />
              <div className="mt-4 h-8 rounded-lg bg-surface-750" />
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <EmptyState
          icon={Film}
          title={isError ? 'Couldn’t Load Videos' : hasFilters ? 'No Matching Videos' : 'No Videos Yet'}
          description={
            isError
              ? 'The server couldn’t be reached. Check that the API is running, then reload.'
              : hasFilters
                ? 'Nothing matches these filters. Try a different search or clear the filters.'
                : 'Publish a draft or add a video to get started.'
          }
          action={
            hasFilters ? (
              <Button variant="outline" onClick={() => updateParams({ q: null, status: null, page: null })}>
                Clear Filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div
          className={`grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 ${
            isSwitching ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          {videos.map((video) => (
            <VideoCard
              key={video.video_id}
              video={video}
              selected={selected.includes(video.video_id)}
              selecting={selected.length > 0}
              onSelect={() => toggleSelect(video.video_id)}
              onDelete={() => handleDelete(video)}
              onToggle={(active) => setActive(video, active)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={changePage} disabled={isSwitching} />
      )}

      {/* Bulk action bar */}
      <div
        className={`fixed bottom-6 left-1/2 z-40 -translate-x-1/2 transition-[translate,opacity] duration-200 ${
          selected.length > 0 ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-20 opacity-0'
        }`}
        inert={selected.length === 0}
      >
        <div className="flex items-center gap-2 rounded-2xl border border-surface-600 bg-surface-850 px-3 py-2.5 shadow-2xl shadow-black/30">
          <span className="px-1 text-sm font-medium whitespace-nowrap text-zinc-200 tabular-nums">
            {selected.length} selected
          </span>
          <span className="h-5 w-px bg-surface-600" />
          <Button variant="outline" size="sm" onClick={() => bulkSetActive(true)} leftIcon={<Eye className="size-4" />}>
            Publish
          </Button>
          <Button variant="outline" size="sm" onClick={() => bulkSetActive(false)} leftIcon={<EyeOff className="size-4" />}>
            Hide
          </Button>
          <Button variant="danger" size="sm" onClick={handleBulkDelete} leftIcon={<Trash2 className="size-4" />}>
            Delete
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

interface VideoCardProps {
  video: VideoListItem
  selected: boolean
  // Something on the page is selected, so every card shows its checkbox.
  selecting: boolean
  onSelect: () => void
  onDelete: () => void
  onToggle: (active: boolean) => void
}

function VideoCard({ video, selected, selecting, onSelect, onDelete, onToggle }: VideoCardProps) {
  const active = video.is_active === 1
  const detailsHref = `/video/details/${video.slug}`

  const onCardClick = (e: MouseEvent<HTMLElement>) => {
    // Clicks on links, buttons, inputs and labels keep their own behaviour.
    if ((e.target as HTMLElement).closest('a, button, input, label, select, textarea')) return
    onSelect()
  }

  return (
    <article
      onClick={onCardClick}
      className={`group flex cursor-pointer flex-col rounded-2xl border bg-surface-850 p-3 shadow-panel transition-colors select-none ${
        selected ? 'border-accent-500 ring-2 ring-accent-500/40' : 'border-surface-700 hover:border-accent-500/30'
      }`}
    >
      <div className="relative">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-800">
          <img
            src={video.thumbnail}
            alt=""
            width={320}
            height={180}
            loading="lazy"
            referrerPolicy="no-referrer"
            className={`size-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
              active ? '' : 'opacity-50 grayscale'
            }`}
          />
          <span className="absolute right-2 bottom-2 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white tabular-nums">
            {formatDuration(video.duration)}
          </span>
          {!active && (
            <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
              <EyeOff className="size-3" /> Hidden
            </span>
          )}
          {selected && (
            <span className="pointer-events-none absolute inset-0 rounded-xl bg-accent-500/15 ring-2 ring-accent-500/60 ring-inset" />
          )}
        </div>
        <SelectCheck
          checked={selected}
          onChange={onSelect}
          label={`Select ${video.title}`}
          revealOnHover={!selecting}
          className="absolute top-1.5 left-1.5"
        />
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        <Link
          to={detailsHref}
          className="line-clamp-2 text-sm font-semibold text-zinc-100 transition-colors hover:text-accent-500"
          title={video.title}
        >
          {video.title}
        </Link>
        <p className="mt-1.5 flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1 tabular-nums">
            <Eye className="size-3.5" /> {compactNumber(video.views)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" /> {timeAgo(video.upload_date)}
          </span>
        </p>
        <div className="mt-2 flex min-h-5 flex-wrap gap-1">
          {video.studios.slice(0, 2).map((studio) => (
            <Badge key={studio}>{studio}</Badge>
          ))}
          {video.pstars?.slice(0, 2).map((pstar) => (
            <Badge key={pstar} variant="neutral">
              {pstar}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-surface-700/80 pt-2">
        <div className="flex items-center gap-0.5">
          <ActionLink to={detailsHref} label="View details" icon={<Eye className="size-4" />} />
          <ActionLink to={`/video/edit/${video.slug}`} label="Edit video" icon={<Pencil className="size-4" />} />
          <button
            type="button"
            title="Delete video"
            aria-label="Delete video"
            onClick={onDelete}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          {active ? 'Published' : 'Hidden'}
          <Switch checked={active} onChange={onToggle} label={active ? 'Hide video' : 'Publish video'} />
        </label>
      </div>
    </article>
  )
}

function ActionLink({ to, label, icon }: { to: string; label: string; icon: ReactNode }) {
  return (
    <Link
      to={to}
      title={label}
      aria-label={label}
      className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-hover hover:text-zinc-100"
    >
      {icon}
    </Link>
  )
}

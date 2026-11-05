import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  Folder,
  Link as LinkIcon,
  PenLine,
  Play,
  Server,
  Star,
  Tags,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { VideoDetails as VideoDetailsData, VideoSource } from '../../types'
import { api, type ApiResponse } from '../../lib/api'
import { formatDuration, formatNumber, timeAgo } from '../../lib/format'
import { useVideoListHref } from '../../stores/uiStore'
import { Badge, Button, ButtonLink, Spinner } from '../../components/ui'

const TAXONOMY = [
  { key: 'categories', title: 'Categories', icon: Tags, variant: 'default' },
  { key: 'pornstars', title: 'Cast', icon: Star, variant: 'warning' },
  { key: 'studios', title: 'Studios', icon: Folder, variant: 'success' },
] as const

export function VideoDetails() {
  const { slug = '' } = useParams()
  const listHref = useVideoListHref()
  const [isPlaying, setIsPlaying] = useState(false)
  const [chosenSource, setChosenSource] = useState<VideoSource | null>(null)
  const [descriptionOpen, setDescriptionOpen] = useState(false)

  const { data: video, isPending, isError } = useQuery({
    queryKey: ['video', slug],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<VideoDetailsData>>('/getvideo', { params: { slug } })
      if (!data.success) throw new Error(data.message || 'Video not found')
      return data.data
    },
  })

  useEffect(() => {
    setIsPlaying(false)
    setChosenSource(null)
    setDescriptionOpen(false)
  }, [slug])

  useEffect(() => {
    if (!video) return
    const previous = document.title
    document.title = `${video.title} · P-Tape Admin`
    return () => {
      document.title = previous
    }
  }, [video])

  if (isPending) return <Spinner label="Loading video details…" />
  if (isError || !video) return <Navigate to={listHref} replace />

  const { title, thumbnail, is_active, video_id, upload_date, views, description, duration, videoSources, external_id } =
    video
  const published = is_active === 1
  const activeSource =
    chosenSource ?? videoSources.find((source) => source.is_active) ?? videoSources[0] ?? null
  const activeIndex = activeSource ? Math.max(0, videoSources.indexOf(activeSource)) : 0
  const descriptionText = description?.trim() ?? ''
  const descriptionLong = descriptionText.length > 280 || descriptionText.split('\n').length > 4
  const uploaded = formatDate(upload_date)

  const selectSource = (source: VideoSource) => {
    setChosenSource(source)
  }

  const play = (source?: VideoSource) => {
    const next = source ?? activeSource
    if (!next?.url) return
    setChosenSource(next)
    setIsPlaying(true)
  }

  return (
    <div className="pb-12">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <ButtonLink to={listHref} variant="ghost" size="sm" leftIcon={<ArrowLeft className="size-4" />}>
          Back to videos
        </ButtonLink>
        <div className="flex gap-2">
          <ButtonLink
            href={`https://porntape.net/video/${slug}`}
            variant="outline"
            size="sm"
            leftIcon={<ExternalLink className="size-4" />}
          >
            View on site
          </ButtonLink>
          <ButtonLink to={`/video/edit/${slug}`} size="sm" leftIcon={<PenLine className="size-4" />}>
            Edit
          </ButtonLink>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
        <div className="space-y-3 xl:sticky xl:top-20">
          <Player
            title={title}
            thumbnail={thumbnail}
            duration={duration}
            source={activeSource}
            sourceName={activeSource ? sourceName(activeSource, activeIndex) : 'No source'}
            playing={isPlaying}
            onPlay={() => play()}
          />

          {videoSources.length > 1 && (
            <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
              {videoSources.map((source, index) => {
                const selected = source === activeSource
                return (
                  <button
                    key={sourceKey(source, index)}
                    type="button"
                    onClick={() => selectSource(source)}
                    aria-pressed={selected}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      selected
                        ? 'border-accent-500 bg-accent-500/10 text-accent-600 dark:text-accent-400'
                        : 'border-surface-700 bg-surface-850 text-zinc-400 hover:text-zinc-100'
                    }`}
                  >
                    {sourceName(source, index)}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <header>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant={published ? 'success' : 'danger'}>{published ? 'Published' : 'Hidden'}</Badge>
              {activeSource?.quality && <Badge variant="neutral">{activeSource.quality}</Badge>}
              <span className="text-xs text-zinc-500 tabular-nums">
                {videoSources.length} {videoSources.length === 1 ? 'source' : 'sources'}
              </span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-balance text-zinc-100 sm:text-3xl">{title}</h2>

            <dl className="mt-4 grid grid-cols-3 gap-2">
              <Stat icon={<Eye className="size-3.5" />} label="Views" value={formatNumber(views)} />
              <Stat icon={<Clock className="size-3.5" />} label="Length" value={formatDuration(duration)} />
              <Stat
                icon={<Calendar className="size-3.5" />}
                label="Uploaded"
                value={uploaded}
                title={timeAgo(upload_date)}
              />
            </dl>
          </header>

          <section className="panel p-5">
            <h3 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Description</h3>
            {descriptionText ? (
              <>
                <p
                  className={`mt-2 text-sm leading-relaxed whitespace-pre-line text-zinc-300 ${
                    descriptionLong && !descriptionOpen ? 'line-clamp-4' : ''
                  }`}
                >
                  {descriptionText}
                </p>
                {descriptionLong && (
                  <button
                    type="button"
                    onClick={() => setDescriptionOpen((open) => !open)}
                    className="mt-2 text-xs font-medium text-accent-600 hover:text-accent-500 dark:text-accent-400"
                  >
                    {descriptionOpen ? 'Show less' : 'Show more'}
                  </button>
                )}
              </>
            ) : (
              <p className="mt-2 text-sm text-zinc-500">No description yet.</p>
            )}
          </section>

          <section className="panel divide-y divide-surface-700 overflow-hidden">
            {TAXONOMY.map(({ key, title: label, icon: Icon, variant }) => {
              const tags = video[key]
              return (
                <div key={key} className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:gap-4">
                  <h3 className="flex w-28 shrink-0 items-center gap-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                    <Icon className="size-3.5 text-accent-500" />
                    {label}
                  </h3>
                  {tags.length ? (
                    <div className="flex flex-1 flex-wrap gap-1.5">
                      {tags.map((tag, index) => (
                        <Badge key={`${tag}-${index}`} variant={variant}>
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500">None</p>
                  )}
                </div>
              )
            })}
          </section>
        </div>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <Server className="size-4 text-accent-500" />
            Sources
          </h3>
          <p className="text-xs text-zinc-500">
            {videoSources.length ? 'Play a source in the preview above' : 'Nothing attached yet'}
          </p>
        </div>

        {videoSources.length ? (
          <ul className="space-y-2">
            {videoSources.map((source, index) => {
              const playing = isPlaying && activeSource === source
              const selected = activeSource === source
              return (
                <li
                  key={sourceKey(source, index)}
                  className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 shadow-panel sm:flex-row sm:items-center ${
                    playing
                      ? 'border-accent-500/60 bg-accent-500/5'
                      : selected
                        ? 'border-accent-500/30 bg-surface-850'
                        : 'border-surface-700 bg-surface-850'
                  }`}
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold tabular-nums ${
                      playing ? 'bg-accent-500 text-white' : 'bg-surface-800 text-zinc-400'
                    }`}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 truncate text-sm font-medium text-zinc-100">{sourceName(source, index)}</p>
                      {playing && <span className="text-[11px] font-medium text-accent-600 dark:text-accent-400">Playing</span>}
                      {typeof source.is_active === 'number' && (
                        <span
                          className={`size-1.5 rounded-full ${source.is_active ? 'bg-success' : 'bg-danger'}`}
                          title={source.is_active ? 'Active source' : 'Inactive source'}
                        />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500">{sourceMeta(source)}</p>
                    {source.url && (
                      <p className="mt-1 truncate font-mono text-[11px] text-zinc-500" title={source.url}>
                        {source.url}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button
                      size="sm"
                      variant={playing ? 'primary' : 'secondary'}
                      leftIcon={<Play className="size-3.5 fill-current" />}
                      onClick={() => play(source)}
                      disabled={!source.url}
                    >
                      {playing ? 'Playing' : 'Play'}
                    </Button>
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg p-2 text-zinc-400 transition hover:bg-hover hover:text-accent-500"
                        title="Open source URL"
                        aria-label={`Open ${sourceName(source, index)}`}
                      >
                        <LinkIcon className="size-4" />
                      </a>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-surface-600 px-6 py-10 text-center">
            <Server className="mx-auto size-5 text-zinc-500" />
            <p className="mt-2 text-sm font-medium text-zinc-100">No sources</p>
            <p className="mt-1 text-xs text-zinc-500">Add a file or embed from the edit page.</p>
            <div className="mt-4">
              <ButtonLink to={`/video/edit/${slug}`} variant="outline" size="sm">
                Edit video
              </ButtonLink>
            </div>
          </div>
        )}
      </section>

      <section className="mt-4 overflow-hidden rounded-2xl border border-surface-700 bg-surface-700 shadow-panel">
        <div className="grid gap-px sm:grid-cols-3">
          <CopyCell label="Video ID" value={String(video_id)} />
          <CopyCell label="External ID" value={external_id} />
          <CopyCell label="Slug" value={slug} />
        </div>
      </section>
    </div>
  )
}

function Player({
  title,
  thumbnail,
  duration,
  source,
  sourceName: name,
  playing,
  onPlay,
}: {
  title: string
  thumbnail: string
  duration: number
  source: VideoSource | null
  sourceName: string
  playing: boolean
  onPlay: () => void
}) {
  const frame = 'overflow-hidden rounded-2xl bg-black shadow-panel ring-1 ring-surface-700'

  if (playing && source?.url) {
    const embed = source.file_type === 'embed' || source.url.includes('iframe')
    return (
      <div className={frame}>
        <div className="aspect-video">
          {embed ? (
            <iframe
              key={source.url}
              src={source.url}
              title={title}
              className="size-full border-0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              key={source.url}
              className="size-full"
              controls
              autoPlay
              playsInline
              src={source.url}
              poster={thumbnail}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onPlay}
      disabled={!source?.url}
      className={`group relative block aspect-video w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default ${frame}`}
      aria-label={source?.url ? `Play ${title}` : 'No playable source'}
    >
      <img
        src={thumbnail}
        alt=""
        referrerPolicy="no-referrer"
        className="size-full object-cover transition duration-300 group-hover:scale-[1.02] group-disabled:scale-100"
      />
      <span className="pointer-events-none absolute inset-0 bg-black/10 transition group-hover:bg-black/25 group-disabled:bg-black/35" />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
      <span className="absolute inset-0 flex items-center justify-center">
        {source?.url ? (
          <span className="flex size-16 items-center justify-center rounded-full bg-accent-500 text-white shadow-lg shadow-indigo-bloom/40 transition group-hover:scale-105 group-hover:bg-accent-600">
            <Play className="ml-0.5 size-7 fill-current" strokeWidth={0} />
          </span>
        ) : (
          <span className="rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white">No playable source</span>
        )}
      </span>
      <span className="absolute right-3 bottom-3 left-3 flex items-end justify-between gap-3 text-white">
        <span className="truncate text-xs font-medium text-white/85">{name}</span>
        <span className="shrink-0 rounded-md bg-black/70 px-2 py-1 text-xs font-medium tabular-nums">
          {formatDuration(duration)}
        </span>
      </span>
    </button>
  )
}

function Stat({ icon, label, value, title }: { icon: ReactNode; label: string; value: string; title?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-surface-700 bg-surface-850 px-3 py-2.5">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-semibold text-zinc-100 tabular-nums" title={title ?? value}>
        {value}
      </dd>
    </div>
  )
}

function CopyCell({ label, value }: { label: string; value: string | null }) {
  const [copied, setCopied] = useState(false)
  const text = value?.trim() ? value : null

  const onCopy = async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy')
    }
  }

  return (
    <div className="flex items-center gap-3 bg-surface-850 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">{label}</p>
        <p className="mt-0.5 truncate font-mono text-xs text-zinc-200" title={text ?? undefined}>
          {text ?? '—'}
        </p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        disabled={!text}
        className="rounded-lg p-2 text-zinc-400 transition hover:bg-hover hover:text-zinc-100 disabled:pointer-events-none disabled:opacity-30"
        aria-label={copied ? `${label} copied` : `Copy ${label}`}
      >
        {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
      </button>
    </div>
  )
}

function sourceName(source: VideoSource, index: number) {
  return source.server_name?.trim() || `Source ${index + 1}`
}

function sourceMeta(source: VideoSource) {
  const parts = [source.quality, source.file_type, source.file_size ? `${source.file_size} MB` : null].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'No file details'
}

function sourceKey(source: VideoSource, index: number) {
  return source.id ?? `${source.url ?? 'source'}-${index}`
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

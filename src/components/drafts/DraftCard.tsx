import type { MouseEvent, ReactNode } from 'react'
import { Check, CloudUpload, Eye, FilePlus2, RotateCcw, Search, Sparkles, Star, Trash2 } from 'lucide-react'
import type { DraftVideo } from '../../types'
import { draftStage, uploadLabel } from '../../lib/drafts'
import { timeAgo } from '../../lib/format'
import { Button, SelectCheck } from '../ui'

interface DraftCardProps {
  draft: DraftVideo
  selected: boolean
  isBest: boolean
  // Saved as a video this session but kept in the list.
  published: boolean
  reparsePending: boolean
  onToggleSelect: () => void
  onPublish: () => void
  onUpload: () => void
  onReparse: () => void
  onToggleBest: () => void
  onDelete: () => void
}

export function DraftCard({
  draft,
  selected,
  isBest,
  published,
  reparsePending,
  onToggleSelect,
  onPublish,
  onUpload,
  onReparse,
  onToggleBest,
  onDelete,
}: DraftCardProps) {
  const stage = draftStage(draft)
  const parsing = draft.status !== 'done' && draft.status !== 'failed'
  const progress = draft.upload_progress || 0
  const uploading = ['queued', 'downloading', 'ffmpeg', 'uploading'].includes(draft.upload_status)
  const parseFailed = draft.status === 'failed'

  const primary =
    stage === 'ready' ? (
      <Button className="w-full" onClick={onPublish} leftIcon={<Eye className="size-4" />}>
        {published ? 'Publish Again' : 'Publish'}
      </Button>
    ) : stage === 'upload' ? (
      <Button className="w-full" variant="outline" onClick={onUpload} leftIcon={<CloudUpload className="size-4" />}>
        Upload
      </Button>
    ) : stage === 'failed' ? (
      parseFailed ? (
        <Button
          className="w-full"
          variant="outline"
          onClick={onReparse}
          disabled={reparsePending}
          leftIcon={<Sparkles className="size-4" />}
        >
          Re-parse
        </Button>
      ) : (
        <Button className="w-full" variant="outline" onClick={onUpload} leftIcon={<RotateCcw className="size-4" />}>
          Retry Upload
        </Button>
      )
    ) : (
      <Button className="w-full" variant="secondary" disabled>
        {parsing ? 'Parsing…' : `${uploadLabel(draft.upload_status)} ${progress}%…`}
      </Button>
    )

  const onCardClick = (e: MouseEvent<HTMLElement>) => {
    // Clicks on links, buttons, inputs and labels keep their own behaviour.
    if ((e.target as HTMLElement).closest('a, button, input, label, select, textarea')) return
    onToggleSelect()
  }

  return (
    <article
      onClick={onCardClick}
      className={`group flex cursor-pointer flex-col rounded-2xl border bg-surface-850 p-3 shadow-panel transition-colors select-none ${
        selected ? 'border-accent-500 ring-2 ring-accent-500/40' : 'border-surface-700 hover:border-accent-500/30'
      }`}
    >
      <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-800">
        <img
          src={draft.thumbnail}
          alt=""
          width={320}
          height={180}
          loading="lazy"
          referrerPolicy="no-referrer"
          className={`size-full object-cover ${published ? 'opacity-50' : ''}`}
        />
        {selected && (
          <span className="pointer-events-none absolute inset-0 rounded-xl bg-accent-500/15 ring-2 ring-accent-500/60 ring-inset" />
        )}
        <SelectCheck
          checked={selected}
          onChange={onToggleSelect}
          label={`Select ${draft.title || 'draft'}`}
          className="absolute top-1.5 left-1.5"
        />
        {published && (
          <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-xs font-medium text-white">
            <Check className="size-3" /> Published
          </span>
        )}
        {isBest && !published && (
          <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-warning px-2 py-0.5 text-xs font-medium text-white">
            <Star className="size-3 fill-current" /> Best
          </span>
        )}
        {draft.datetime && (
          <span className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white">
            {timeAgo(draft.datetime)}
          </span>
        )}
        {uploading && (
          <span className="absolute inset-x-0 bottom-0 h-1 bg-black/50">
            <span
              className="block h-full bg-info transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </span>
        )}
      </div>

      <h3 className="mt-3 line-clamp-2 min-h-10 text-sm font-semibold text-zinc-100" title={draft.title}>
        {draft.title || 'Untitled draft'}
      </h3>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
        <StageChip
          tone={parseFailed ? 'danger' : parsing ? 'info' : 'success'}
          icon={<Sparkles className={`size-3 ${parsing ? 'animate-pulse' : ''}`} />}
        >
          {parseFailed ? 'Parse failed' : parsing ? 'Parsing' : 'Parsed'}
        </StageChip>
        <StageChip
          tone={
            draft.upload_status === 'completed'
              ? 'success'
              : draft.upload_status === 'failed'
                ? 'danger'
                : uploading
                  ? 'info'
                  : 'neutral'
          }
          icon={<CloudUpload className="size-3" />}
        >
          {uploadLabel(draft.upload_status)}
          {uploading && <span className="tabular-nums"> {progress}%</span>}
        </StageChip>
      </div>

      <div className="mt-3">{primary}</div>

      <div className="mt-2 flex items-center justify-between border-t border-surface-700/80 pt-2">
        <div className="flex">
          {draft.status === 'done' && stage !== 'ready' && (
            <IconAction label="Publish without upload" onClick={onPublish}>
              <FilePlus2 className="size-4" />
            </IconAction>
          )}
          {/* A failed parse already offers Re-parse as the main button. */}
          {draft.status === 'done' && (
            <IconAction label="Re-parse with AI" onClick={onReparse} disabled={reparsePending}>
              <Sparkles className="size-4" />
            </IconAction>
          )}
          <IconAction
            label="Search images on Google"
            onClick={() =>
              window.open(
                `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(draft.title)}`,
                '_blank',
                'noopener',
              )
            }
          >
            <Search className="size-4" />
          </IconAction>
          <IconAction label={isBest ? 'Unmark best' : 'Mark as best'} onClick={onToggleBest} active={isBest}>
            <Star className={`size-4 ${isBest ? 'fill-current' : ''}`} />
          </IconAction>
        </div>
        <IconAction label="Delete draft" onClick={onDelete} danger>
          <Trash2 className="size-4" />
        </IconAction>
      </div>
    </article>
  )
}

const chipTones = {
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
  neutral: 'bg-surface-750 text-zinc-500',
}

function StageChip({ tone, icon, children }: { tone: keyof typeof chipTones; icon: ReactNode; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${chipTones[tone]}`}>
      {icon}
      {children}
    </span>
  )
}

function IconAction({
  label,
  onClick,
  disabled,
  danger,
  active,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  active?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg p-2 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 ${
        active
          ? 'text-warning hover:bg-warning/10'
          : danger
            ? 'text-zinc-400 hover:bg-danger/10 hover:text-danger'
            : 'text-zinc-400 hover:bg-hover hover:text-zinc-100'
      }`}
    >
      {children}
    </button>
  )
}

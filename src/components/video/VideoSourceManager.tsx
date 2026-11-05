import { useState } from 'react'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { useController, type Control } from 'react-hook-form'
import type { VideoFormSource, VideoFormValues } from '../../types'
import { emptySource } from '../../lib/video'
import { Button } from '../ui'

const fieldClass =
  'h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 transition focus:border-accent-500 focus:bg-surface-900 focus:outline-none focus:ring-2 focus:ring-ring'

export function VideoSourceManager({ control }: { control: Control<VideoFormValues> }) {
  const {
    field: { value, onChange },
  } = useController({ name: 'videoSources', control })
  const sources = value ?? []
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const updateSource = (id: string, changes: Partial<VideoFormSource>) => {
    onChange(sources.map((source) => (source.id === id ? { ...source, ...changes } : source)))
  }

  const moveSource = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    const reordered = [...sources]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)
    onChange(reordered)
  }

  return (
    <div className="space-y-3">
      {sources.length === 0 && (
        <p className="rounded-xl border border-dashed border-surface-600 px-4 py-6 text-center text-sm text-zinc-500">
          No sources yet. Add one below.
        </p>
      )}

      {sources.map((source, index) => (
        <div
          key={source.id}
          draggable
          onDragStart={() => setDragIndex(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragIndex !== null) moveSource(dragIndex, index)
            setDragIndex(null)
          }}
          onDragEnd={() => setDragIndex(null)}
          className={`flex flex-wrap items-center gap-2 rounded-xl border bg-surface-900/50 p-2 transition md:flex-nowrap ${
            dragIndex === index ? 'border-accent-500/50 opacity-60' : 'border-surface-700'
          }`}
        >
          <span className="cursor-grab px-1 text-zinc-500" title="Drag to reorder">
            <GripVertical className="size-4" />
          </span>
          <input
            type="number"
            step="any"
            aria-label="File size (MB)"
            placeholder="Size (MB)"
            value={source.file_size ?? ''}
            onChange={(e) =>
              updateSource(source.id, { file_size: e.target.value ? parseFloat(e.target.value) : null })
            }
            className={`${fieldClass} w-28`}
          />
          <select
            aria-label="File type"
            value={source.file_type ?? ''}
            onChange={(e) => updateSource(source.id, { file_type: e.target.value })}
            className={`${fieldClass} w-24`}
          >
            <option value="mp4">MP4</option>
            <option value="hls">HLS</option>
          </select>
          <select
            aria-label="Quality"
            value={source.quality || '720p'}
            onChange={(e) => updateSource(source.id, { quality: e.target.value })}
            className={`${fieldClass} w-24`}
          >
            <option value="480p">480p</option>
            <option value="720p">720p</option>
            <option value="1080p">1080p</option>
          </select>
          <input
            type="text"
            aria-label="Source URL"
            placeholder="Video source URL"
            value={source.url}
            onChange={(e) => updateSource(source.id, { url: e.target.value })}
            className={`${fieldClass} min-w-48 flex-1`}
          />
          <button
            type="button"
            aria-label="Remove source"
            title="Remove source"
            onClick={() => onChange(sources.filter((item) => item.id !== source.id))}
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        leftIcon={<Plus className="size-4" />}
        onClick={() => onChange([...sources, emptySource()])}
      >
        Add source
      </Button>
    </div>
  )
}

import { Pencil, Trash2 } from 'lucide-react'
import { Switch } from '../ui'

interface EntityCardActionsProps {
  noun: string
  active: boolean
  onEdit: () => void
  onDelete: () => void
  onToggle: (active: boolean) => void
}

export function EntityCardActions({ noun, active, onEdit, onDelete, onToggle }: EntityCardActionsProps) {
  return (
    <div className="mt-auto flex items-center justify-between border-t border-surface-700 px-3 py-2.5">
      <div className="flex gap-1">
        <button
          type="button"
          title={`Edit ${noun}`}
          aria-label={`Edit ${noun}`}
          onClick={onEdit}
          className="rounded-lg p-2 text-zinc-400 transition hover:bg-hover hover:text-zinc-100"
        >
          <Pencil className="size-4" />
        </button>
        <button
          type="button"
          title={`Delete ${noun}`}
          aria-label={`Delete ${noun}`}
          onClick={onDelete}
          className="rounded-lg p-2 text-zinc-400 transition hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <Switch checked={active} onChange={onToggle} label={active ? 'Active' : 'Inactive'} />
    </div>
  )
}

export function StatPair({ items }: { items: [label: string, value: string][] }) {
  return (
    <div className="grid w-full grid-cols-2 gap-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-surface-700 bg-surface-900/50 px-2 py-1.5 text-center">
          <p className="text-[10px] font-medium tracking-wide text-zinc-500 uppercase">{label}</p>
          <p className="mt-0.5 text-sm font-semibold text-zinc-100">{value}</p>
        </div>
      ))}
    </div>
  )
}

import { useState, type FormEvent } from 'react'
import { Users } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import type { Pornstar } from '../types'
import { api, errorMessage, type ApiResponse } from '../lib/api'
import { compactNumber } from '../lib/format'
import { useEntityList } from '../hooks/useEntityList'
import { EntityPage } from '../components/entity/EntityPage'
import { EntityCardActions, StatPair } from '../components/entity/EntityCardActions'
import { Avatar, Button, Input, Modal } from '../components/ui'

export function Pornstars() {
  const list = useEntityList<Pornstar>({ endpoint: 'pornstars', type: 'pornstar', idKey: 'pstar_id' })
  // null = closed, {} = add, { pornstar } = edit
  const [modal, setModal] = useState<{ pornstar?: Pornstar } | null>(null)

  return (
    <EntityPage
      noun="Pornstar"
      plural="pornstars"
      icon={Users}
      list={list}
      onAdd={() => setModal({})}
      getKey={(pornstar) => pornstar.pstar_id}
      renderCard={(pornstar) => (
        <article className="relative flex flex-col overflow-hidden rounded-2xl border border-surface-700 bg-surface-850 shadow-panel transition hover:border-accent-500/30">
          <div
            className={`absolute inset-x-0 top-0 h-1 ${
              pornstar.is_active ? 'bg-linear-to-r from-indigo-bloom via-slate-blue to-cloudy-sky' : 'bg-surface-700'
            }`}
          />
          <div className="flex flex-1 flex-col items-center gap-3 p-4 pt-5">
            <Avatar name={pornstar.name} size="xl" />
            <h3 className="w-full truncate text-center text-sm font-semibold text-zinc-100" title={pornstar.name}>
              {pornstar.name}
            </h3>
            <StatPair
              items={[
                ['Videos', pornstar.video_count.toLocaleString()],
                ['Views', compactNumber(pornstar.total_views)],
              ]}
            />
          </div>
          <EntityCardActions
            noun="pornstar"
            active={pornstar.is_active === 1}
            onEdit={() => setModal({ pornstar })}
            onDelete={() => list.deleteItem(pornstar)}
            onToggle={(active) => list.toggleActive(pornstar.pstar_id, active)}
          />
        </article>
      )}
    >
      {modal && <PornstarFormModal pornstar={modal.pornstar} onClose={() => setModal(null)} />}
    </EntityPage>
  )
}

function PornstarFormModal({ pornstar, onClose }: { pornstar?: Pornstar; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(pornstar?.name ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const action = pornstar ? 'update' : 'add'

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload = { name }
      const { data } = pornstar
        ? await api.post<ApiResponse<unknown>>('/edit-pornstar', { pornstar_id: pornstar.pstar_id, ...payload })
        : await api.post<ApiResponse<unknown>>('/add-pornstar', payload)
      if (!data.success) {
        throw new Error(data.message)
      }

      queryClient.invalidateQueries({ queryKey: ['pornstars'] })
      queryClient.invalidateQueries({ queryKey: ['select-options', 'pornstars'] })
      toast.success(`Pornstar ${action === 'add' ? 'added' : 'updated'}`)
      onClose()
    } catch (error) {
      toast.error(errorMessage(error, `Failed to ${action} pornstar`))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={pornstar ? 'Edit pornstar' : 'New pornstar'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="pornstar-form" loading={isSubmitting}>
            {pornstar ? 'Save changes' : 'Create pornstar'}
          </Button>
        </>
      }
    >
      <form id="pornstar-form" onSubmit={handleSave} className="space-y-4">
        <Input
          label="Pornstar name"
          placeholder="e.g. Riley Reid"
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </form>
    </Modal>
  )
}

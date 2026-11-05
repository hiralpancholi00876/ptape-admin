import { useState, type FormEvent } from 'react'
import { Film, Tags } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import type { Category } from '../types'
import { api, errorMessage, type ApiResponse } from '../lib/api'
import { tintFromName } from '../lib/format'
import { useEntityList } from '../hooks/useEntityList'
import { EntityPage } from '../components/entity/EntityPage'
import { EntityCardActions } from '../components/entity/EntityCardActions'
import { Button, Input, Modal } from '../components/ui'

export function Categories() {
  const list = useEntityList<Category>({ endpoint: 'categories', type: 'category', idKey: 'category_id' })
  // null = closed, {} = add, { category } = edit
  const [modal, setModal] = useState<{ category?: Category } | null>(null)

  return (
    <EntityPage
      noun="Category"
      plural="categories"
      icon={Tags}
      list={list}
      onAdd={() => setModal({})}
      getKey={(category) => category.category_id}
      renderCard={(category) => (
        <article className="relative flex flex-col overflow-hidden rounded-2xl border border-surface-700 bg-surface-850 shadow-panel transition hover:border-accent-500/30">
          <div
            className={`absolute inset-x-0 top-0 h-1 ${
              category.is_active ? 'bg-linear-to-r from-indigo-bloom via-slate-blue to-cloudy-sky' : 'bg-surface-700'
            }`}
          />
          <div className="flex flex-1 flex-col items-center gap-3 p-4 pt-5">
            <div
              className={`flex size-14 items-center justify-center rounded-2xl bg-linear-to-br text-2xl font-bold text-white shadow-sm ${tintFromName(category.name)}`}
            >
              {category.name.charAt(0).toUpperCase()}
            </div>
            <h3 className="w-full truncate text-center text-sm font-semibold text-zinc-100" title={category.name}>
              {category.name}
            </h3>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-700 bg-surface-900/50 px-3 py-1 text-xs font-medium text-zinc-300">
              <Film className="size-3.5 text-accent-500" />
              {category.video_count.toLocaleString()} videos
            </span>
          </div>
          <EntityCardActions
            noun="category"
            active={category.is_active === 1}
            onEdit={() => setModal({ category })}
            onDelete={() => list.deleteItem(category)}
            onToggle={(active) => list.toggleActive(category.category_id, active)}
          />
        </article>
      )}
    >
      {modal && <CategoryFormModal category={modal.category} onClose={() => setModal(null)} />}
    </EntityPage>
  )
}

function CategoryFormModal({ category, onClose }: { category?: Category; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(category?.name ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const action = category ? 'update' : 'add'

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const { data } = category
        ? await api.post<ApiResponse<unknown>>('/edit-category', { category_id: category.category_id, name })
        : await api.post<ApiResponse<unknown>>('/add-category', { name })
      if (!data.success) {
        throw new Error(data.message)
      }

      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['select-options', 'categories'] })
      toast.success(`Category ${action === 'add' ? 'added' : 'updated'}`)
      onClose()
    } catch (error) {
      toast.error(errorMessage(error, `Failed to ${action} category`))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={category ? 'Edit category' : 'New category'}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" loading={isSubmitting}>
            {category ? 'Save changes' : 'Create category'}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSave}>
        <Input
          label="Category name"
          placeholder="e.g. Amateur"
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </form>
    </Modal>
  )
}

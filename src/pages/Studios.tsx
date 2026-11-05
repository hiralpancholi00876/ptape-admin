import { useState, type FormEvent } from 'react'
import { Building2, Globe } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import type { Studio } from '../types'
import { api, errorMessage, type ApiResponse } from '../lib/api'
import { compactNumber } from '../lib/format'
import { useEntityList } from '../hooks/useEntityList'
import { EntityPage } from '../components/entity/EntityPage'
import { EntityCardActions, StatPair } from '../components/entity/EntityCardActions'
import { Button, Input, Modal } from '../components/ui'

const websiteUrl = (website: string) => (website.startsWith('http') ? website : `https://${website}`)

const websiteHost = (website: string) => {
  try {
    return new URL(websiteUrl(website)).hostname.replace('www.', '')
  } catch {
    return 'Website'
  }
}

export function Studios() {
  const list = useEntityList<Studio>({ endpoint: 'studios', type: 'studio', idKey: 'studio_id' })
  // null = closed, {} = add, { studio } = edit
  const [modal, setModal] = useState<{ studio?: Studio } | null>(null)

  return (
    <EntityPage
      noun="Studio"
      plural="studios"
      icon={Building2}
      list={list}
      onAdd={() => setModal({})}
      getKey={(studio) => studio.studio_id}
      renderCard={(studio) => (
        <article className="flex flex-col rounded-2xl border border-surface-700 bg-surface-850 shadow-panel transition hover:border-accent-500/30">
          <div className="flex flex-1 flex-col items-center gap-3 p-4">
            <h3 className="w-full truncate text-center text-sm font-semibold text-zinc-100" title={studio.name}>
              {studio.name}
            </h3>
            <StatPair
              items={[
                ['Videos', studio.video_count.toLocaleString()],
                ['Views', compactNumber(studio.total_views)],
              ]}
            />
            {studio.website ? (
              <a
                href={websiteUrl(studio.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex max-w-full items-center gap-1 truncate text-xs text-accent-500 hover:underline"
              >
                <Globe className="size-3 shrink-0" />
                {websiteHost(studio.website)}
              </a>
            ) : (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Globe className="size-3" /> No website
              </span>
            )}
          </div>
          <EntityCardActions
            noun="studio"
            active={studio.is_active === 1}
            onEdit={() => setModal({ studio })}
            onDelete={() => list.deleteItem(studio)}
            onToggle={(active) => list.toggleActive(studio.studio_id, active)}
          />
        </article>
      )}
    >
      {modal && <StudioFormModal studio={modal.studio} onClose={() => setModal(null)} />}
    </EntityPage>
  )
}

function StudioFormModal({ studio, onClose }: { studio?: Studio; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(studio?.name ?? '')
  const [website, setWebsite] = useState(studio?.website ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const action = studio ? 'update' : 'add'

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload = { name, website: website || null }
      const { data } = studio
        ? await api.post<ApiResponse<unknown>>('/edit-studio', { studio_id: studio.studio_id, ...payload })
        : await api.post<ApiResponse<unknown>>('/add-studio', payload)
      if (!data.success) {
        throw new Error(data.message)
      }

      queryClient.invalidateQueries({ queryKey: ['studios'] })
      queryClient.invalidateQueries({ queryKey: ['select-options', 'studios'] })
      toast.success(`Studio ${action === 'add' ? 'added' : 'updated'}`)
      onClose()
    } catch (error) {
      toast.error(errorMessage(error, `Failed to ${action} studio`))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={studio ? 'Edit studio' : 'New studio'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="studio-form" loading={isSubmitting}>
            {studio ? 'Save changes' : 'Create studio'}
          </Button>
        </>
      }
    >
      <form id="studio-form" onSubmit={handleSave} className="space-y-4">
        <Input
          label="Studio name"
          placeholder="e.g. Brazzers"
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Website URL"
          hint="Optional"
          placeholder="https://example.com"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </form>
    </Modal>
  )
}

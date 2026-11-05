import { useState, type FormEvent } from 'react'
import { BadgeCheck, Plus, Trash2, Users } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import type { Pornstar, SocialLink } from '../types'
import { api, errorMessage, type ApiResponse } from '../lib/api'
import { compactNumber } from '../lib/format'
import { useEntityList } from '../hooks/useEntityList'
import { EntityPage } from '../components/entity/EntityPage'
import { EntityCardActions, StatPair } from '../components/entity/EntityCardActions'
import { Avatar, Badge, Button, Input, Modal } from '../components/ui'

const EMPTY_LINK: SocialLink = { name: '', link: '' }

function parseSocialLinks(raw: Pornstar['social_links'] | undefined): SocialLink[] {
  try {
    const links = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(links) ? links : []
  } catch {
    return []
  }
}

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
            <Avatar src={pornstar.profile_pic} name={pornstar.name} size="xl" />
            <h3 className="w-full truncate text-center text-sm font-semibold text-zinc-100" title={pornstar.name}>
              {pornstar.name}
            </h3>
            {parseSocialLinks(pornstar.social_links).length > 0 ? (
              <Badge variant="info">
                <BadgeCheck className="mr-1 size-3" /> Socials
              </Badge>
            ) : (
              <Badge variant="neutral">No socials</Badge>
            )}
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
  const [profilePic, setProfilePic] = useState(pornstar?.profile_pic ?? '')
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(() => {
    const links = parseSocialLinks(pornstar?.social_links)
    return links.length > 0 ? links : [EMPTY_LINK]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const action = pornstar ? 'update' : 'add'

  const updateSocialLink = (index: number, field: keyof SocialLink, value: string) => {
    setSocialLinks((links) => links.map((link, i) => (i === index ? { ...link, [field]: value } : link)))
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload = {
        name,
        profile_pic: profilePic || null,
        social_links: socialLinks.filter((link) => link.name.trim() && link.link.trim()),
      }
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
      size="lg"
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
      <form id="pornstar-form" onSubmit={handleSave} className="space-y-5">
        <Input
          label="Pornstar name"
          placeholder="e.g. Riley Reid"
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Input
              label="Profile picture URL"
              placeholder="https://example.com/images/profile.jpg"
              value={profilePic}
              onChange={(e) => setProfilePic(e.target.value)}
            />
          </div>
          {profilePic && <Avatar src={profilePic} name={name || '?'} size="lg" />}
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-zinc-300">Social media links</p>
          <div className="space-y-2">
            {socialLinks.map((link, index) => (
              <div key={index} className="flex gap-2">
                <div className="w-1/3">
                  <Input
                    placeholder="Platform (e.g. X)"
                    aria-label="Platform"
                    value={link.name}
                    onChange={(e) => updateSocialLink(index, 'name', e.target.value)}
                  />
                </div>
                <Input
                  placeholder="URL"
                  aria-label="URL"
                  value={link.link}
                  onChange={(e) => updateSocialLink(index, 'link', e.target.value)}
                />
                <button
                  type="button"
                  aria-label="Remove link"
                  disabled={socialLinks.length <= 1}
                  onClick={() => setSocialLinks(socialLinks.filter((_, i) => i !== index))}
                  className="shrink-0 rounded-xl px-3 text-zinc-400 transition hover:bg-danger/10 hover:text-danger disabled:opacity-30"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-accent-500"
            leftIcon={<Plus className="size-4" />}
            onClick={() => setSocialLinks([...socialLinks, EMPTY_LINK])}
          >
            Add another link
          </Button>
        </div>
      </form>
    </Modal>
  )
}

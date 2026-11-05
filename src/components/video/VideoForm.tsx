import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from 'react'
import { useBlocker } from 'react-router-dom'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { AlertTriangle, ChevronDown, Clipboard, Eye, EyeOff, Save } from 'lucide-react'
import type { VideoFormSource, VideoFormValues } from '../../types'
import { NO_THUMBNAIL_IMAGE } from '../../lib/format'
import { confirm, useConfirmStore } from '../../stores/confirmStore'
import { Button, Input, Switch, Textarea } from '../ui'
import { TaxonomySelect } from './TaxonomySelect'
import { VideoSourceManager } from './VideoSourceManager'

const MOD_KEY = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl+'

interface VideoFormProps {
  mode: 'create' | 'edit'
  // 'page' floats the action bar inside the page; 'panel' pins it to the bottom of a drawer.
  variant?: 'page' | 'panel'
  defaultValues: VideoFormValues
  // Resolves true once saved; on false the form keeps the user's input.
  onSubmit: (values: VideoFormValues) => Promise<boolean>
  // Called after a successful save, once leaving no longer needs a warning.
  onSaved?: (values: VideoFormValues) => void
  onDirtyChange?: (dirty: boolean) => void
  // Pages warn before navigating away with unsaved changes; the publish panel guards its own close.
  guardNavigation?: boolean
  // Extra controls at the start of the action bar.
  footerStart?: ReactNode
}

function sourceSummary(sources: VideoFormSource[]) {
  const filled = sources.filter((source) => source.url.trim())
  if (!filled.length) return null
  const first = filled[0]
  const detail = [first.file_type?.toUpperCase(), first.quality].filter(Boolean).join(' · ')
  return `${filled.length} ${filled.length === 1 ? 'source' : 'sources'}${detail ? ` · ${detail}` : ''}`
}

export function VideoForm({
  mode,
  variant = 'page',
  defaultValues,
  onSubmit,
  onSaved,
  onDirtyChange,
  guardNavigation = false,
  footerStart,
}: VideoFormProps) {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<VideoFormValues>({ defaultValues })
  const thumbnail = useWatch({ control, name: 'thumbnail' })
  const sources = useWatch({ control, name: 'videoSources' })
  const formRef = useRef<HTMLFormElement>(null)
  const saveRef = useRef<HTMLButtonElement>(null)
  const publishRef = useRef<HTMLButtonElement>(null)
  // Set once a save succeeds, so the navigation that follows isn't blocked.
  const savedRef = useRef(false)
  const [pendingIntent, setPendingIntent] = useState<'hidden' | 'publish' | 'save' | null>(null)
  // Sources start folded when they're already filled in (e.g. from an uploaded draft).
  const [sourcesOpenByDefault] = useState(() => !defaultValues.videoSources.some((s) => s.url.trim()))
  const summary = sourceSummary(sources ?? [])

  const submit = handleSubmit(async (values, event) => {
    const submitter = (event?.nativeEvent as SubmitEvent | undefined)?.submitter
    const intent = mode === 'edit' ? 'save' : submitter?.getAttribute('value') === 'publish' ? 'publish' : 'hidden'
    const final = mode === 'edit' ? values : { ...values, is_active: intent === 'publish' }
    setPendingIntent(intent)
    try {
      if (await onSubmit(final)) {
        savedRef.current = true
        onSaved?.(final)
      }
    } finally {
      setPendingIntent(null)
    }
  })

  const reportDirty = useEffectEvent((dirty: boolean) => onDirtyChange?.(dirty))
  useEffect(() => reportDirty(isDirty), [isDirty])

  // Closing or reloading the tab.
  useEffect(() => {
    if (!guardNavigation || !isDirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [guardNavigation, isDirty])

  // Navigating elsewhere in the app.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      guardNavigation && isDirty && !savedRef.current && currentLocation.pathname !== nextLocation.pathname,
  )
  const askToLeave = useEffectEvent(() =>
    confirm({
      title: 'Discard Unsaved Changes?',
      message: 'Your edits to this video haven’t been saved yet.',
      confirmLabel: 'Discard Changes',
      onConfirm: () => blocker.proceed?.(),
      onCancel: () => blocker.reset?.(),
    }),
  )
  useEffect(() => {
    if (blocker.state === 'blocked') askToLeave()
  }, [blocker.state])

  // ⌘S saves; ⌘↵ publishes a new video.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || useConfirmStore.getState().options) return
      const key = e.key.toLowerCase()
      const button = key === 's' ? saveRef.current : key === 'enter' ? publishRef.current : null
      if (!button) return
      e.preventDefault()
      if (!button.disabled) formRef.current?.requestSubmit(button)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const pasteThumbnail = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) setValue('thumbnail', text.trim(), { shouldDirty: true, shouldValidate: true })
    } catch (err) {
      console.error('Failed to read clipboard', err)
    }
  }

  const panel = variant === 'panel'

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="flex min-h-full flex-col">
      <div className={`grid flex-1 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] ${panel ? 'p-5' : ''}`}>
        <div className="space-y-5">
          <Section title="Details">
            <div className="space-y-4">
              <Input
                label="Title"
                required
                placeholder="e.g. Riley Reid and Abella Danger in…"
                autoComplete="off"
                error={errors.title?.message}
                {...register('title', { required: 'Add a title' })}
              />
              <TaxonomySelect name="categories" label="Categories" control={control} errors={errors} required />
              <TaxonomySelect name="pornstars" label="Pornstars" control={control} errors={errors} required />
              <TaxonomySelect name="studios" label="Studios" control={control} />
              <Textarea
                label="Description"
                rows={3}
                placeholder="Optional. Shown on the video page and used for SEO…"
                {...register('description')}
              />
            </div>
          </Section>

          <details
            open={sourcesOpenByDefault}
            className="group rounded-2xl border border-surface-700 bg-surface-850 shadow-panel"
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl px-5 py-3.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden">
              <h3 className="text-sm font-semibold text-zinc-100">Video Sources</h3>
              {summary ? (
                <span className="text-xs text-zinc-500">{summary}</span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-warning">
                  <AlertTriangle className="size-3.5" /> No source yet
                </span>
              )}
              <ChevronDown className="ml-auto size-4 text-zinc-500 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-surface-700 p-5">
              <VideoSourceManager control={control} />
            </div>
          </details>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-5">
          <Section title="Thumbnail">
            <div className="space-y-3">
              <div className="aspect-video overflow-hidden rounded-xl border border-surface-700 bg-surface-800">
                <img
                  key={thumbnail}
                  src={thumbnail || NO_THUMBNAIL_IMAGE}
                  alt="Thumbnail preview"
                  width={352}
                  height={198}
                  referrerPolicy="no-referrer"
                  className="size-full object-cover"
                />
              </div>
              <Input
                label="Image URL"
                required
                type="url"
                placeholder="https://…"
                autoComplete="off"
                spellCheck={false}
                error={errors.thumbnail?.message}
                rightSlot={
                  <button
                    type="button"
                    onClick={pasteThumbnail}
                    title="Paste from clipboard"
                    aria-label="Paste image URL from clipboard"
                    className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-hover hover:text-accent-500"
                  >
                    <Clipboard className="size-4" />
                  </button>
                }
                {...register('thumbnail', { required: 'Add a thumbnail image URL' })}
              />
            </div>
          </Section>

          <Section title="Publishing">
            <div className="space-y-4">
              <Input
                label="Date & Time"
                required
                type="datetime-local"
                error={errors.datetime?.message}
                {...register('datetime', { required: 'Pick when the video goes live' })}
              />
              <Input
                label="Duration"
                required
                placeholder="00:00:00"
                inputMode="numeric"
                autoComplete="off"
                className="tabular-nums"
                error={errors.duration?.message}
                {...register('duration', { required: 'Add the duration, e.g. 00:24:10' })}
              />
              {mode === 'edit' && (
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-surface-700 bg-surface-900/50 px-3.5 py-3">
                      <div>
                        <p className="text-sm font-medium text-zinc-100">{field.value ? 'Published' : 'Hidden'}</p>
                        <p className="text-xs text-zinc-500">
                          {field.value ? 'Visible on the site' : 'Not visible on the site'}
                        </p>
                      </div>
                      <Switch checked={field.value} onChange={field.onChange} label="Published" />
                    </div>
                  )}
                />
              )}
            </div>
          </Section>
        </aside>
      </div>

      <div
        className={`sticky z-10 flex flex-wrap items-center gap-3 border-surface-700 bg-surface-850/95 backdrop-blur-md ${
          panel ? 'bottom-0 border-t px-5 py-3' : 'bottom-4 mt-5 rounded-2xl border px-4 py-3 shadow-panel'
        }`}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-2">
          {footerStart}
          {isDirty && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-warning" role="status">
              <span className="size-1.5 rounded-full bg-warning" aria-hidden />
              Unsaved changes
            </span>
          )}
        </div>
        <p className="hidden text-xs text-zinc-500 lg:block">
          <kbd className="font-sans">{MOD_KEY}S</kbd> {mode === 'create' ? 'save hidden' : 'save'}
          {mode === 'create' && (
            <>
              {' · '}
              <kbd className="font-sans">{MOD_KEY}↵</kbd> publish
            </>
          )}
        </p>
        {mode === 'create' ? (
          <div className="flex gap-2">
            <Button
              ref={saveRef}
              type="submit"
              name="intent"
              value="hidden"
              variant="secondary"
              loading={pendingIntent === 'hidden'}
              disabled={isSubmitting}
              leftIcon={<EyeOff className="size-4" />}
            >
              Save Hidden
            </Button>
            <Button
              ref={publishRef}
              type="submit"
              name="intent"
              value="publish"
              loading={pendingIntent === 'publish'}
              disabled={isSubmitting}
              leftIcon={<Eye className="size-4" />}
            >
              {pendingIntent === 'publish' ? 'Publishing…' : 'Publish'}
            </Button>
          </div>
        ) : (
          <Button ref={saveRef} type="submit" loading={pendingIntent === 'save'} leftIcon={<Save className="size-4" />}>
            {pendingIntent === 'save' ? 'Saving…' : 'Save Changes'}
          </Button>
        )}
      </div>
    </form>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-surface-700 bg-surface-850 shadow-panel">
      <h3 className="border-b border-surface-700 px-5 py-3.5 text-sm font-semibold text-zinc-100">{title}</h3>
      <div className="p-5">{children}</div>
    </section>
  )
}

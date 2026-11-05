import { Controller, type Control, type FieldErrors } from 'react-hook-form'
import CreatableSelect from 'react-select/creatable'
import { useQuery } from '@tanstack/react-query'
import { RefreshCcw } from 'lucide-react'
import type { Option, VideoFormValues } from '../../types'
import { api, type ApiResponse } from '../../lib/api'
import { toOptions } from '../../lib/format'
import { FieldLabel } from '../ui'

const SINGULAR = { studios: 'studio', pornstars: 'pornstar', categories: 'category' }

interface TaxonomySelectProps {
  // Form field name; also the API endpoint the options are loaded from.
  name: 'studios' | 'pornstars' | 'categories'
  label: string
  control: Control<VideoFormValues>
  errors?: FieldErrors<VideoFormValues>
  required?: boolean
}

export function TaxonomySelect({ name, label, control, errors, required }: TaxonomySelectProps) {
  const inputId = `${name}-select-input`
  const { data: options = [], refetch, isFetching } = useQuery({
    queryKey: ['select-options', name],
    queryFn: async (): Promise<Option[]> => {
      const { data } = await api.get<ApiResponse<{ name: string }[]>>(`/${name}`)
      if (!data.success) return []
      return toOptions(data.data.map((item) => item.name))
    },
    // Saving a video or editing studios/pornstars/categories invalidates these, so a minute is safe.
    staleTime: 60 * 1000,
  })

  const error = errors?.[name]?.message

  return (
    <div>
      <FieldLabel htmlFor={inputId} required={required}>
        {label}
      </FieldLabel>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <Controller
            name={name}
            control={control}
            rules={required ? { required: `Add at least one ${SINGULAR[name]}` } : undefined}
            render={({ field }) => (
              <CreatableSelect<Option, true>
                ref={field.ref}
                isMulti
                unstyled
                inputId={inputId}
                aria-invalid={Boolean(error)}
                name={name}
                options={options}
                isLoading={isFetching}
                value={field.value ?? []}
                onChange={(selected) => field.onChange([...selected])}
                onBlur={field.onBlur}
                placeholder={`Search or create ${label.toLowerCase()}…`}
                classNames={{
                  control: ({ isFocused }) =>
                    `min-h-11 rounded-xl border bg-surface-950 px-2 text-sm shadow-sm transition ${
                      isFocused
                        ? 'border-accent-500 bg-surface-900 ring-2 ring-ring'
                        : error
                          ? 'border-danger/50'
                          : 'border-surface-700'
                    }`,
                  valueContainer: () => 'gap-1 py-1.5 pl-1',
                  placeholder: () => 'text-zinc-500',
                  input: () => 'text-zinc-100',
                  singleValue: () => 'text-zinc-100',
                  multiValue: () =>
                    'items-center rounded-lg border border-accent-500/20 bg-accent-500/10 text-accent-600 dark:text-accent-400',
                  multiValueLabel: () => 'px-2 py-0.5 text-xs font-medium',
                  multiValueRemove: () => 'rounded-r-lg px-1 py-1 hover:bg-danger/15 hover:text-danger',
                  indicatorsContainer: () => 'gap-1 text-zinc-500',
                  clearIndicator: () => 'rounded-md p-1 hover:text-zinc-200',
                  dropdownIndicator: () => 'rounded-md p-1 hover:text-zinc-200',
                  indicatorSeparator: () => 'my-2 w-px self-stretch bg-surface-700',
                  loadingIndicator: () => 'p-1',
                  // z-10 lifts the menu over the selects below it but keeps it under the sticky form header.
                  menu: () =>
                    'z-10 mt-2 overflow-hidden rounded-xl border border-surface-600 bg-surface-850 shadow-xl shadow-black/20',
                  menuList: () => 'scrollbar-thin p-1',
                  option: ({ isFocused }) =>
                    `cursor-pointer rounded-lg px-3 py-2 text-sm ${
                      isFocused ? 'bg-hover text-zinc-100' : 'text-zinc-300'
                    }`,
                  noOptionsMessage: () => 'px-3 py-2 text-sm text-zinc-500',
                  loadingMessage: () => 'px-3 py-2 text-sm text-zinc-500',
                }}
              />
            )}
          />
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          title={`Reload ${name}`}
          aria-label={`Reload ${name}`}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-surface-700 text-zinc-400 transition hover:bg-hover hover:text-zinc-100"
        >
          <RefreshCcw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-danger">{String(error)}</p>}
    </div>
  )
}

import { useId, type ComponentProps } from 'react'
import { FieldLabel } from './FieldLabel'

interface TextareaProps extends ComponentProps<'textarea'> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className = '', id, rows = 4, ...props }: TextareaProps) {
  const autoId = useId()
  const inputId = id ?? autoId

  return (
    <div className="w-full">
      {label && (
        <FieldLabel htmlFor={inputId} required={props.required}>
          {label}
        </FieldLabel>
      )}
      <textarea
        id={inputId}
        rows={rows}
        className={`w-full rounded-xl border bg-surface-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 shadow-sm transition focus:bg-surface-900 focus:outline-none focus:ring-2 focus:ring-ring ${
          error ? 'border-danger/50 focus:border-danger' : 'border-surface-700 focus:border-accent-500'
        } ${className}`}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  )
}

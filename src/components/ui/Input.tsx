import { useId, type ComponentProps, type ReactNode } from 'react'
import { FieldLabel } from './FieldLabel'

interface InputProps extends ComponentProps<'input'> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
  rightSlot?: ReactNode
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightSlot,
  className = '',
  id,
  ...props
}: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId

  return (
    <div className="w-full">
      {label && (
        <FieldLabel htmlFor={inputId} required={props.required}>
          {label}
        </FieldLabel>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-zinc-500">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          className={`h-11 w-full rounded-xl border bg-surface-950 text-sm leading-none text-zinc-100 placeholder:text-zinc-500 shadow-sm transition focus:bg-surface-900 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 ${
            error
              ? 'border-danger/50 focus:border-danger'
              : 'border-surface-700 focus:border-accent-500'
          } ${leftIcon ? 'pl-10' : 'pl-3.5'} ${rightSlot ? 'pr-11' : 'pr-3.5'} ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {rightSlot && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {rightSlot}
          </div>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>
      ) : null}
    </div>
  )
}
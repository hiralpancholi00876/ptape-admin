import type { ReactNode } from 'react'

interface FieldLabelProps {
  htmlFor: string
  required?: boolean
  children: ReactNode
}

export function FieldLabel({ htmlFor, required, children }: FieldLabelProps) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-zinc-300">
      {children}
      {required && (
        <span className="ml-0.5 text-danger" aria-hidden>
          *
        </span>
      )}
    </label>
  )
}

interface SpinnerProps {
  label?: string
  className?: string
}

export function Spinner({ label = 'Loading…', className = '' }: SpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-16 ${className}`}
      role="status"
    >
      <span className="size-8 animate-spin rounded-full border-2 border-accent-500 border-r-transparent" />
      <span className="text-sm text-zinc-400">{label}</span>
    </div>
  )
}
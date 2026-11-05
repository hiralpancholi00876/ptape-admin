import { ButtonLink } from '../components/ui'

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-950 px-4 text-center">
      <p className="bg-linear-to-br from-indigo-bloom via-slate-blue to-pearl-aqua bg-clip-text text-8xl font-bold tracking-tight text-transparent">
        404
      </p>
      <p className="mt-4 mb-6 text-base text-zinc-400">We can’t seem to find the page you are looking for.</p>
      <ButtonLink to="/" variant="secondary">
        Back to home
      </ButtonLink>
    </div>
  )
}

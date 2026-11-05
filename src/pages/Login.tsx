import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Clapperboard, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { api, errorMessage, type ApiResponse } from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import { Button, Input, ThemeToggle } from '../components/ui'

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 30_000

export function Login() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const signIn = useAuthStore((state) => state.signIn)
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/'

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (isLocked) {
      setError('Too many failed attempts. Please try again later.')
      return
    }

    setError(null)

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError('Please fill in all fields.')
      return
    }

    // Slow down repeated guessing in this tab; the server is the real gatekeeper.
    if (attempts >= MAX_ATTEMPTS) {
      setIsLocked(true)
      setError('Too many failed attempts. Please wait 30 seconds.')
      window.setTimeout(() => {
        setIsLocked(false)
        setAttempts(0)
        setError(null)
      }, LOCKOUT_MS)
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post<ApiResponse<{ token: string }>>('/login', {
        email: trimmedEmail,
        password,
      })
      if (!data.success) {
        throw new Error(data.message || 'Login failed. Please check your credentials.')
      }
      // Flipping isAuthenticated re-renders into the <Navigate> above.
      signIn(data.data.token)
    } catch (err) {
      setAttempts((prev) => prev + 1)
      setError(errorMessage(err, 'Something went wrong. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 size-[28rem] rounded-full bg-indigo-bloom/15 blur-3xl" />
        <div className="absolute top-1/3 right-0 size-[26rem] rounded-full bg-slate-blue/10 blur-3xl" />
        <div className="absolute right-0 bottom-0 size-[32rem] rounded-full bg-pearl-aqua/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--ink-400) 1px, transparent 1px), linear-gradient(to bottom, var(--ink-400) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="absolute top-4 right-4 z-10 sm:top-6 sm:right-6">
        <ThemeToggle compact />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
        <div className="w-full">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-linear-to-br from-indigo-bloom via-slate-blue to-cloudy-sky text-white shadow-sm shadow-indigo-bloom/30">
              <Clapperboard className="size-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-zinc-100">P-Tape Admin</p>
              <p className="text-sm text-zinc-500">Sign in to continue</p>
            </div>
          </div>

          <div className="rounded-2xl border border-surface-700 bg-surface-850/95 p-6 shadow-panel sm:p-8">
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="size-4" />}
                placeholder="Enter your email"
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="size-4" />}
                placeholder="••••••••"
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-hover hover:text-zinc-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                }
              />

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
                >
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" loading={loading} disabled={isLocked}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

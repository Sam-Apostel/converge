import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Button } from '@progress/kendo-react-buttons'

import { authClient } from '#/lib/auth-client'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const { redirect } = Route.useSearch()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const afterAuth = () => router.navigate({ to: redirect ?? '/' })

  const errorMessage = (err: unknown, fallback: string) => {
    if (err && typeof err === 'object' && 'message' in err) {
      const message = (err as { message?: unknown }).message
      if (typeof message === 'string' && message.trim()) return message
    }
    return fallback
  }

  async function onEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res =
        mode === 'sign-in'
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({ email, password, name })
      if (res.error)
        setError(
          errorMessage(
            res.error,
            mode === 'sign-in'
              ? 'Could not sign in. Check your email and password and try again.'
              : 'Could not create your account. Try again or use a different email.',
          ),
        )
      else afterAuth()
    } catch (err) {
      setError(errorMessage(err, 'Could not reach the server. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  async function onSocial() {
    setError(null)
    setBusy(true)
    try {
      const res = await authClient.signIn.social({ provider: 'github' })
      if (res?.error)
        setError(errorMessage(res.error, 'GitHub sign-in failed. Try again.'))
    } catch (err) {
      setError(errorMessage(err, 'GitHub sign-in failed. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  async function onPasskey() {
    setError(null)
    setBusy(true)
    try {
      const res = await authClient.signIn.passkey()
      if (res?.error)
        setError(errorMessage(res.error, 'Passkey sign-in failed. Try again.'))
      else afterAuth()
    } catch (err) {
      setError(errorMessage(err, 'Passkey sign-in failed. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-brand-50 p-6">
      <div
        className={cn(
          'w-full max-w-sm p-7',
          'rounded-2xl border border-black/5 bg-white shadow-sm',
        )}
      >
        <div className="mb-6 flex items-center gap-2">
          <span
            className={cn(
              'grid h-8 w-8 place-items-center',
              'rounded-xl bg-brand-500',
              'font-bold text-white',
            )}
          >
            C
          </span>
          <span className="text-lg font-semibold">Converge</span>
        </div>

        <h1 className="text-xl font-semibold">
          {mode === 'sign-in' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="mt-1 text-body text-muted">
          {mode === 'sign-in'
            ? 'Sign in to discover people, capture moments, and keep the conversation going.'
            : 'Create an account to discover people, capture moments, and keep the conversation going.'}
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <Button onClick={onSocial} fillMode="outline" disabled={busy}>
            Continue with GitHub
          </Button>
          <Button onClick={onPasskey} fillMode="outline" disabled={busy}>
            Continue with a passkey
          </Button>
        </div>

        <div className="my-5 flex items-center gap-3 text-caption text-muted">
          <span className="h-px flex-1 bg-black/10" />
          or
          <span className="h-px flex-1 bg-black/10" />
        </div>

        <form onSubmit={onEmailSubmit} className="flex flex-col gap-3">
          {mode === 'sign-up' ? (
            <input
              required
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn(
                'px-3 py-2 text-body',
                'rounded-xl border border-black/10 outline-none',
                'focus:border-brand-400',
              )}
            />
          ) : null}
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn(
              'px-3 py-2 text-body',
              'rounded-xl border border-black/10 outline-none',
              'focus:border-brand-400',
            )}
          />
          <input
            required
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cn(
              'px-3 py-2 text-body',
              'rounded-xl border border-black/10 outline-none',
              'focus:border-brand-400',
            )}
          />
          {error ? <p className="text-body text-red-600">{error}</p> : null}
          <Button type="submit" themeColor="primary" disabled={busy}>
            {mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <button
          onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
          className="mt-4 w-full text-center text-body text-brand-600 hover:underline"
        >
          {mode === 'sign-in'
            ? 'Need an account? Create one'
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}

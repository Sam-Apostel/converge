import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Button } from '@progress/kendo-react-buttons'

import { authClient } from '#/lib/auth-client'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const afterAuth = () => router.navigate({ to: '/' })

  async function onEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res =
        mode === 'sign-in'
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({ email, password, name })
      if (res.error) setError(res.error.message ?? 'Something went wrong')
      else afterAuth()
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
          Sign in to discover people, capture moments, and keep the conversation
          going.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <Button
            onClick={() => authClient.signIn.social({ provider: 'github' })}
            fillMode="outline"
          >
            Continue with GitHub
          </Button>
          <Button
            onClick={() => authClient.signIn.passkey().then(afterAuth)}
            fillMode="outline"
          >
            Sign in with a passkey
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
            ? 'Need an account? Sign up'
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}

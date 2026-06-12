import { Link, createFileRoute } from '@tanstack/react-router'
import { Avatar } from '@progress/kendo-react-layout'
import { Button } from '@progress/kendo-react-buttons'

import { PageHeader } from '#/components/page-header'
import { authClient, useSession } from '#/lib/auth-client'

export const Route = createFileRoute('/_app/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { data: session, isPending } = useSession()
  const user = session?.user

  if (isPending) {
    return <p className="text-body text-muted">Loading…</p>
  }

  if (!user) {
    return (
      <div>
        <PageHeader title="Profile" />
        <div className="rounded-2xl border border-black/5 bg-white/70 p-6">
          <p className="text-body text-muted">You’re not signed in.</p>
          <Link to="/login" className="mt-3 inline-block">
            <Button themeColor="primary">Sign in</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Profile"
        subtitle="Your identity, intent, current focus, conversation preferences and projects."
        actions={
          <Button fillMode="outline" onClick={() => authClient.signOut()}>
            Sign out
          </Button>
        }
      />

      <div className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white/70 p-6">
        <Avatar type="text" themeColor="primary" rounded="full" size="large">
          {(user.name ?? 'U').charAt(0)}
        </Avatar>
        <div>
          <p className="text-lg font-semibold">{user.name}</p>
          <p className="text-body text-muted">{user.email}</p>
        </div>
      </div>
    </div>
  )
}

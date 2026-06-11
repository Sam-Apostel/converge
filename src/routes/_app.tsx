import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { AppBar, AppBarSection, AppBarSpacer, Avatar } from '@progress/kendo-react-layout'
import { Button } from '@progress/kendo-react-buttons'

import { navItems } from '#/lib/navigation'
import { useSession } from '#/lib/auth-client'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  const { data: session } = useSession()
  const user = session?.user

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-black/5 bg-white/70 p-4 backdrop-blur md:flex">
        <Link to="/" className="mb-6 flex items-center gap-2 px-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-500 font-bold text-white">
            C
          </span>
          <span className="text-lg font-semibold tracking-tight">Converge</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === '/' }}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-ink/70 transition-colors hover:bg-brand-50 hover:text-ink"
              activeProps={{
                className: 'bg-brand-50 text-brand-700',
              }}
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </Link>
          ))}
        </nav>

        <p className="px-3 pt-4 text-xs text-muted">The conference companion.</p>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AppBar className="border-b border-black/5 bg-white/70 backdrop-blur">
          <AppBarSection>
            <span className="text-sm font-medium text-muted md:hidden">Converge</span>
          </AppBarSection>
          <AppBarSpacer />
          <AppBarSection>
            <Link to="/concierge">
              <Button fillMode="flat" themeColor="primary">
                Ask the concierge
              </Button>
            </Link>
          </AppBarSection>
          <AppBarSection>
            {user ? (
              <Link to="/profile" className="flex items-center gap-2">
                <Avatar type="text" themeColor="primary" size="medium" rounded="full">
                  {(user.name ?? 'U').charAt(0)}
                </Avatar>
              </Link>
            ) : (
              <Link to="/login">
                <Button themeColor="primary">Sign in</Button>
              </Link>
            )}
          </AppBarSection>
        </AppBar>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

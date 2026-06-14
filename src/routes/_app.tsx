import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

import { Avatar, NotificationProvider } from '#/components/ui'
import { ConvergeLogo } from '#/components/converge-logo'
import { useSession } from '#/lib/auth-client'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

const NAV = [
  { to: '/', label: 'Home', exact: true },
  { to: '/sessions', label: 'Session', exact: false },
  { to: '/discussions', label: 'Discussions', exact: false },
  { to: '/projects', label: 'Projects', exact: false },
  { to: '/people', label: 'People', exact: false },
] as const

const BOTTOM_NAV = [
  {
    to: '/',
    label: 'Home',
    exact: true,
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 12L12 3l9 9M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9" />
      </svg>
    ),
    iconActive: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <path d="M11.293 2.293a1 1 0 0 1 1.414 0l9 9A1 1 0 0 1 21 13h-1v7a1 1 0 0 1-1 1h-5v-5h-4v5H5a1 1 0 0 1-1-1v-7H3a1 1 0 0 1-.707-1.707l9-9z" />
      </svg>
    ),
  },
  {
    to: '/sessions',
    label: 'Sessions',
    exact: false,
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
    iconActive: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
  },
  {
    to: '/discussions',
    label: 'Discuss',
    exact: false,
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    iconActive: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    to: '/projects',
    label: 'Projects',
    exact: false,
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    iconActive: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: '/people',
    label: 'People',
    exact: false,
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
      </svg>
    ),
    iconActive: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
] as const

function AppLayout() {
  const { data: session } = useSession()
  const userName = session?.user?.name ?? ''

  return (
    <NotificationProvider>
      <div className="min-h-screen pb-[72px] lg:pb-0">
        <header
          className={cn(
            'hidden lg:block sticky top-0 z-50 px-0 pb-8',
            'lg:top-4 lg:px-5',
          )}
        >
          <div className="justify-center mx-0 flex max-w-[1320px] items-center gap-6">
            <Link to="/" className="flex shrink-0 items-center gap-4">
              <ConvergeLogo size={64} rounded="10px" background={false} />
            </Link>
            <div
              className={cn(
                'flex items-center py-[11px] pr-3',
                '[backdrop-filter:blur(28px)_saturate(1.7)]',
                'gap-4 rounded-[22px] border border-white/60 bg-white/34 pl-[15px] shadow-glass',
              )}
            >
              <Link to="/" className="flex shrink-0 items-center gap-4">
                <span className="text-[19px] font-semibold tracking-tighter">
                  converge
                </span>
              </Link>

              <nav className="ml-auto items-center gap-0.5 flex">
                {NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    activeOptions={{ exact: item.exact }}
                    className={cn(
                      'rounded-full px-[14px] py-[9px]',
                      'text-note font-medium text-slate',
                      'transition-colors hover:text-ink',
                    )}
                    activeProps={{
                      className: cn(
                        'rounded-full px-[14px] py-[9px]',
                        'text-note font-semibold text-ink',
                        'bg-white shadow-soft',
                      ),
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <Link to="/profile" className="ml-auto shrink-0 lg:ml-1">
                <Avatar name={userName} size={36} />
              </Link>
            </div>
          </div>
        </header>
        <header className="lg:hidden sticky top-4 z-50 px-8 flex gap-2">
          <Link to="/" className="flex shrink-0 items-center gap-4">
            <ConvergeLogo size={32} rounded="5px" background={false} />
          </Link>
          <div
            className={cn(
              'flex items-center gap-3 py-1 pl-4 pr-3',
              '[backdrop-filter:blur(12px)_saturate(1.7)]',
              'rounded-[22px] border border-white/60 bg-white/34 lg:pl-[15px] shadow-glass',
            )}
          >
            <Link to="/" className="flex shrink-0 items-center gap-4">
              <span className="text-[19px] font-semibold tracking-tighter">
                converge
              </span>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-[1320px] px-6 py-8 md:px-[30px]">
          <Outlet />
        </main>

        {/* Mobile bottom tab bar */}
        <nav
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50 flex',
            'border-t border-edge/22 bg-white/60 pb-safe',
            '[backdrop-filter:blur(12px)_saturate(1.6)] lg:hidden',
          )}
        >
          {BOTTOM_NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5',
                'text-tiny font-medium text-gray-800',
                'transition-colors',
              )}
              activeProps={{
                className: cn(
                  'flex flex-1 flex-col items-center gap-1 py-2.5',
                  'text-tiny font-semibold text-ink',
                  'transition-colors',
                ),
              }}
            >
              {({ isActive }: { isActive: boolean }) => (
                <>
                  {isActive ? item.iconActive : item.icon}
                  {item.label}
                </>
              )}
            </Link>
          ))}
          <Link to="/profile" className="flex-1 grid place-items-center">
            <Avatar name={userName} size={36} />
          </Link>
        </nav>
      </div>
    </NotificationProvider>
  )
}

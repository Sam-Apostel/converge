import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

import { Avatar } from '#/components/ui'
import { ConvergeLogo } from '#/components/converge-logo'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

const NAV = [
  { to: '/', label: 'Home', exact: true },
  { to: '/sessions', label: 'Session', exact: false },
  { to: '/discussions', label: 'Discussions', exact: false },
  { to: '/projects', label: 'Projects', exact: false },
  { to: '/people', label: 'People', exact: false },
  { to: '/venue', label: 'Venue', exact: false },
] as const

const BOTTOM_NAV = [
  {
    to: '/',
    label: 'Home',
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    iconActive: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: '/people',
    label: 'People',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
      </svg>
    ),
    iconActive: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
] as const

function AppLayout() {
  return (
    <div className="min-h-screen pb-[72px] lg:pb-0">
      <header className="sticky top-0 z-50 px-0 lg:top-4 lg:px-5">
        <div className="mx-auto flex max-w-[1320px] items-center gap-3 border-b border-white/40 bg-[rgba(233,235,247,.82)] py-[11px] pl-4 pr-3 [backdrop-filter:blur(28px)_saturate(1.7)] lg:gap-4 lg:rounded-[22px] lg:border lg:border-white/60 lg:bg-white/34 lg:pl-[15px] lg:[box-shadow:0_14px_44px_rgba(40,50,110,.16),inset_0_1px_0_rgba(255,255,255,.75)]">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <ConvergeLogo size={32} rounded="10px" />
            <span className="text-[19px] font-semibold tracking-[-0.03em]">
              converge
            </span>
          </Link>

          <span className="shrink-0 rounded-full border border-white/50 bg-white/50 px-[11px] py-[5px] font-mono text-[11.5px] tracking-[0.02em] text-mist lg:hidden">
            Day 1 · AMS
          </span>
          <span className="hidden shrink-0 rounded-full border border-white/50 bg-white/50 px-[11px] py-[5px] font-mono text-[11.5px] tracking-[0.02em] text-mist lg:block">
            Day 1 · Amsterdam
          </span>

          <nav className="ml-auto hidden items-center gap-0.5 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact }}
                className="rounded-full px-[14px] py-[9px] text-[13.5px] font-medium text-slate transition-colors hover:text-ink"
                activeProps={{
                  className:
                    'rounded-full px-[14px] py-[9px] text-[13.5px] font-semibold text-ink bg-white [box-shadow:0_2px_8px_rgba(40,50,110,.12)]',
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link to="/profile" className="ml-auto shrink-0 lg:ml-1">
            <Avatar name="Sam Conway" size={36} />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] px-6 py-8 md:px-[30px]">
        <Outlet />
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-[rgba(180,185,220,.22)] bg-[rgba(233,235,247,.82)] pb-safe [backdrop-filter:blur(24px)_saturate(1.6)] lg:hidden">
        {BOTTOM_NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.exact }}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted transition-colors"
            activeProps={{ className: 'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-ink transition-colors' }}
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                {isActive ? item.iconActive : item.icon}
                {item.label}
              </>
            )}
          </Link>
        ))}
      </nav>
    </div>
  )
}

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

function AppLayout() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-4 z-50 px-5">
        <div className="mx-auto flex max-w-[1320px] items-center gap-4 rounded-[22px] border border-white/60 bg-white/34 py-[11px] pl-[15px] pr-3 [backdrop-filter:blur(28px)_saturate(1.7)] [box-shadow:0_14px_44px_rgba(40,50,110,.16),inset_0_1px_0_rgba(255,255,255,.75)]">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <ConvergeLogo size={32} rounded="10px" />
            <span className="text-[19px] font-semibold tracking-[-0.03em]">
              converge
            </span>
          </Link>

          <span className="hidden shrink-0 rounded-full border border-white/50 bg-white/50 px-[11px] py-[5px] font-mono text-[11.5px] tracking-[0.02em] text-mist lg:block">
            Day 1 · Amsterdam
          </span>

          <nav className="ml-auto flex items-center gap-0.5">
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
            <Link to="/profile" className="ml-1 shrink-0">
              <Avatar name="Sam Conway" size={36} />
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] px-6 py-8 md:px-[30px]">
        <Outlet />
      </main>
    </div>
  )
}

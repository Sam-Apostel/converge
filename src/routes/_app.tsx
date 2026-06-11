import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

import { Avatar } from '#/components/ui'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

const NAV = [
  { to: '/', label: 'Home', exact: true },
  { to: '/sessions', label: 'Sessions', exact: false },
  { to: '/people', label: 'People', exact: false },
  { to: '/projects', label: 'Projects', exact: false },
  { to: '/discussions', label: 'Discussions', exact: false },
] as const

function AppLayout() {
  return (
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-50 border-b border-[rgba(120,130,180,.14)] bg-[rgba(238,240,250,.72)] backdrop-blur-xl [backdrop-filter:blur(18px)_saturate(1.5)]">
        <div className="mx-auto flex max-w-[1320px] items-center gap-6 px-6 py-3.5 md:px-[30px]">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="inline-block h-[13px] w-[13px] rounded-[5px] bg-lime shadow-[0_0_0_3px_rgba(153,255,0,.22),0_2px_6px_rgba(120,160,20,.4)]" />
            <span className="text-[19px] font-semibold tracking-[-0.03em]">
              converge
            </span>
          </Link>

          <span className="hidden h-5 w-px bg-[rgba(120,130,180,.22)] sm:block" />
          <span className="hidden font-mono text-[12px] tracking-[0.02em] text-mist lg:block">
            React Summit 2026 · Amsterdam · Day 1
          </span>

          <nav className="ml-auto flex items-center gap-1.5">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact }}
                className="rounded-full px-[15px] py-2 text-[13.5px] font-medium text-slate transition-colors hover:text-ink"
                activeProps={{
                  className:
                    'rounded-full px-[15px] py-2 text-[13.5px] font-medium !text-ink bg-white shadow-soft [box-shadow:0_1px_3px_rgba(40,50,110,.08),inset_0_1px_0_rgba(255,255,255,.7)]',
                }}
              >
                {item.label}
              </Link>
            ))}
            <Link to="/profile" className="ml-1.5">
              <Avatar name="Sam Conway" size={34} />
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

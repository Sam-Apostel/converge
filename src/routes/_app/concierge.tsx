import { createFileRoute } from '@tanstack/react-router'

import { PageHeader } from '#/components/page-header'
import { ConciergeChat } from '#/components/concierge/concierge-chat'
import { getConciergeStatus } from '#/lib/concierge/settings'

export const Route = createFileRoute('/_app/concierge')({
  loader: () => getConciergeStatus(),
  component: ConciergePage,
})

function ConciergePage() {
  const status = Route.useLoaderData()

  return (
    <div>
      <PageHeader
        title="AI Concierge"
        subtitle="Your guide to the conference. Ask anything — the concierge can search people, sessions and projects, and act on the same data exposed through Converge."
      />
      <ConciergeChat status={status} />
    </div>
  )
}

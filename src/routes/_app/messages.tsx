import { createFileRoute } from '@tanstack/react-router'

import { FeaturePlaceholder } from '#/components/feature-placeholder'

export const Route = createFileRoute('/_app/messages')({
  component: () => (
    <FeaturePlaceholder
      title="Messages"
      subtitle="Direct messages and connections — the network that remains after the conference ends."
      buildOut={[
        'Direct message threads (message table)',
        'Connection requests and accepted contacts (connection table)',
        'Unread indicators driven by the SSE stream',
        'Start a conversation from a profile or project',
      ]}
    />
  ),
})

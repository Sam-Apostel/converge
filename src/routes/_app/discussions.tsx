import { createFileRoute } from '@tanstack/react-router'

import { FeaturePlaceholder } from '#/components/feature-placeholder'

export const Route = createFileRoute('/_app/discussions')({
  component: () => (
    <FeaturePlaceholder
      title="Discussions"
      subtitle="Questions become conversations: Question → Answer → Follow-up → Community Discussion → Real-world Meetup."
      buildOut={[
        'Topic channels and persistent threads (discussion + discussion_post)',
        'Promote a session question into a discussion thread',
        'Speaker responses and follow-ups',
        'Meet-up suggestions surfaced from active threads',
        'Real-time updates via the SSE stream (discussion.post events)',
      ]}
    />
  ),
})

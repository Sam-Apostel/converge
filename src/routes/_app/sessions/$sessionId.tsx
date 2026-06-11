import { createFileRoute } from '@tanstack/react-router'

import { FeaturePlaceholder } from '#/components/feature-placeholder'

export const Route = createFileRoute('/_app/sessions/$sessionId')({
  component: SessionDetail,
})

function SessionDetail() {
  const { sessionId } = Route.useParams()
  return (
    <FeaturePlaceholder
      title="Session"
      subtitle={`The operating system for attending a talk (session ${sessionId}).`}
      buildOut={[
        'Live timeline of the talk',
        'One-tap "Bookmark moment" (moment table) with transcript snippet + slide ref',
        'Live questions and upvotes (question table)',
        'Session discussion thread',
        'Related people and projects',
        'Text + voice notes (note table)',
        'AI summary and AI-generated highlights',
        'Real-time updates over SSE (channel session:<id>)',
      ]}
    />
  )
}

import { createFileRoute } from '@tanstack/react-router'

import { FeaturePlaceholder } from '#/components/feature-placeholder'

export const Route = createFileRoute('/_app/people/$userId')({
  component: PersonDetail,
})

function PersonDetail() {
  const { userId } = Route.useParams()
  return (
    <FeaturePlaceholder
      title="Profile"
      subtitle={`A person's rich profile (user ${userId}).`}
      buildOut={[
        'Identity: name, role, company',
        'Intent: why they’re here',
        'Current focus and featured projects',
        'Conversation preferences (interested / not interested)',
        'Connect + message actions',
        'Shared sessions and discussions',
      ]}
    />
  )
}

import { createFileRoute } from '@tanstack/react-router'

import { FeaturePlaceholder } from '#/components/feature-placeholder'

export const Route = createFileRoute('/_app/projects/$slug')({
  component: ProjectDetail,
})

function ProjectDetail() {
  const { slug } = Route.useParams()
  return (
    <FeaturePlaceholder
      title="Project"
      subtitle={`Project profile (${slug}).`}
      buildOut={[
        'Description, screenshots, team and tech stack',
        '"Looking for" calls to action',
        'Related sessions and related people',
        'Discussion thread for the project',
        'Trending score and billboard eligibility',
      ]}
    />
  )
}

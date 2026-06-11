import { createFileRoute } from '@tanstack/react-router'

import { FeaturePlaceholder } from '#/components/feature-placeholder'

export const Route = createFileRoute('/_app/venue')({
  component: () => (
    <FeaturePlaceholder
      title="Venue"
      subtitle="Rooms, walking times, and the conference billboard — where ideas and people are the stars, not sponsor logos."
      buildOut={[
        'Venue map with rooms (room table) and floors',
        'Walking-time estimates to your next session',
        'Conference billboard: trending projects, discussions, meetups',
        'Featured attendees and community achievements',
      ]}
    />
  ),
})

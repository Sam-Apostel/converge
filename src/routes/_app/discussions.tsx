import {
  Link,
  Outlet,
  createFileRoute,
  useChildMatches,
} from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

import {
  LifecycleRail,
  StartDiscussion,
  Thread,
  TopicChannels,
  TrendingQuestionCard,
} from '#/components/discussion'
import { listDiscussions } from '#/lib/queries/discussions'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/_app/discussions')({
  loader: () => listDiscussions(),
  component: DiscussionsRoute,
})

/**
 * `discussions.tsx` owns the `/discussions` segment, so it's also the layout for
 * `/discussions/$id`. Render the index when we're the leaf, otherwise hand off
 * to the child route.
 */
function DiscussionsRoute() {
  const childMatches = useChildMatches()
  return childMatches.length > 0 ? <Outlet /> : <DiscussionsIndex />
}

function DiscussionsIndex() {
  const { channels, featured, trending } = Route.useLoaderData()

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Discussions</h1>

      <LifecycleRail />

      {featured ? (
        <div className="grid grid-cols-1 items-start gap-[22px] lg:grid-cols-[1.6fr_1fr]">
          <Thread
            thread={featured}
            headerRight={
              <Link
                to="/discussions/$id"
                params={{ id: featured.id }}
                className={cn(
                  'inline-flex items-center gap-1',
                  'text-caption font-medium text-muted',
                  'transition-colors hover:text-ink',
                )}
              >
                Open thread <ArrowRight size={13} />
              </Link>
            }
          />

          <div className="flex flex-col gap-4">
            <TopicChannels channels={channels} />
            <TrendingQuestionCard trending={trending} />
          </div>
        </div>
      ) : (
        <StartDiscussion />
      )}
    </div>
  )
}

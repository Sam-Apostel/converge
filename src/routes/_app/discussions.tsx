import {
  Link,
  Outlet,
  createFileRoute,
  useChildMatches,
} from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

import {
  LifecycleRail,
  Thread,
  TopicChannels,
  TrendingQuestionCard,
} from '#/components/discussion'
import { listDiscussions } from '#/lib/queries/discussions'

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
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">
        Discussions — questions that don't disappear
      </h1>
      <p className="mb-6 mt-1 max-w-2xl text-[14.5px] text-mist">
        Traditional Q&amp;A answers a handful and drops the rest. Converge turns
        each question into a thread with a life of its own — and the best ones end
        as a real meetup.
      </p>

      <LifecycleRail />

      <div className="grid grid-cols-1 items-start gap-[22px] lg:grid-cols-[1.6fr_1fr]">
        {featured ? (
          <Thread
            thread={featured}
            headerRight={
              <Link
                to="/discussions/$id"
                params={{ id: featured.id }}
                className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[#8186a0] transition-colors hover:text-ink"
              >
                Open thread <ArrowRight size={13} />
              </Link>
            }
          />
        ) : (
          <p className="rounded-2xl border border-dashed border-black/10 bg-white/60 p-6 text-sm text-muted">
            No discussions yet.
          </p>
        )}

        <div className="flex flex-col gap-4">
          <TopicChannels channels={channels} />
          <TrendingQuestionCard trending={trending} />
        </div>
      </div>
    </div>
  )
}

import { Link, createFileRoute } from '@tanstack/react-router'

import { LifecycleRail, Thread } from '#/components/discussion'
import { getDiscussion } from '#/lib/queries/discussions'

export const Route = createFileRoute('/_app/discussions/$id')({
  loader: ({ params }) => getDiscussion({ data: params.id }),
  component: DiscussionDetail,
})

function DiscussionDetail() {
  const thread = Route.useLoaderData()

  return (
    <div className="mx-auto max-w-[860px]">
      <Link
        to="/discussions"
        className="text-[13px] font-medium text-mist transition-colors hover:text-ink"
      >
        ← Discussions
      </Link>

      {thread ? (
        <>
          <h1 className="mb-1 mt-3 text-2xl font-semibold tracking-[-0.02em]">
            {thread.title}
          </h1>
          <p className="mb-6 text-[14.5px] text-mist">
            {thread.sessionTitle
              ? `Grew out of "${thread.sessionTitle}"`
              : 'A persistent conference thread.'}
          </p>

          <LifecycleRail />
          <Thread thread={thread} />
        </>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-black/10 bg-white/60 p-6 text-sm text-muted">
          This discussion doesn't exist or has been archived.
        </p>
      )}
    </div>
  )
}

import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { LifecycleRail, Thread } from '#/components/discussion'
import { getDiscussion } from '#/lib/queries/discussions'
import { cn } from '#/lib/utils'

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
        className={cn(
          'inline-flex items-center gap-1',
          'text-note font-medium text-mist',
          'transition-colors hover:text-ink',
        )}
      >
        <ArrowLeft size={15} /> Discussions
      </Link>

      {thread ? (
        <>
          <h1 className="mb-1 mt-3 text-2xl font-semibold tracking-tight">
            {thread.title}
          </h1>
          <p className="mb-6 text-body text-mist">
            {thread.sessionTitle
              ? `Grew out of "${thread.sessionTitle}"`
              : 'A persistent conference thread.'}
          </p>

          <LifecycleRail />
          <Thread thread={thread} />
        </>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-black/10 bg-white/60 p-6 text-body text-muted">
          This discussion doesn't exist or has been archived.
        </p>
      )}
    </div>
  )
}

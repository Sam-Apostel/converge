import { ChevronUp } from 'lucide-react'

import { Card, Mono } from '#/components/ui'
import type { TopicChannel, TrendingQuestion } from '#/lib/queries/discussions'

import { useQuestionVote } from './question-vote'

/** Right-rail list of topic channels — the active one sits on the inner surface. */
export function TopicChannels({ channels }: { channels: Array<TopicChannel> }) {
  return (
    <Card surface="white" className="p-5">
      <div className="mb-3.5 text-body font-semibold">Discussions</div>
      <div className="flex flex-col gap-0.5">
        {channels.map((c) => (
          <div
            key={c.topic}
            className={`flex items-center justify-between rounded-[11px] px-2.5 py-[9px] ${
              c.active ? 'bg-inner' : ''
            }`}
          >
            <span
              className={`text-note font-medium ${
                c.active ? 'text-ink-soft' : 'text-slate'
              }`}
            >
              #{c.topic}
            </span>
            <span
              className={`font-mono text-caption ${
                c.active ? 'text-ink-soft' : 'text-faint'
              }`}
            >
              {c.posts}
            </span>
          </div>
        ))}
        {channels.length === 0 && (
          <p className="text-note text-muted">No discussions yet.</p>
        )}
      </div>
    </Card>
  )
}

/** The single most-upvoted open question across the conference. */
export function TrendingQuestionCard({
  trending,
}: {
  trending: TrendingQuestion | null
}) {
  if (!trending) return null
  return <TrendingQuestionInner key={trending.id} trending={trending} />
}

function TrendingQuestionInner({ trending }: { trending: TrendingQuestion }) {
  const vote = useQuestionVote(trending.id, {
    count: trending.upvotes,
    hasVoted: trending.hasVoted,
  })
  return (
    <Card surface="white" className="p-5">
      <Mono tone="ghost" className="mb-2.5 block !text-tiny">
        Trending question
      </Mono>
      <p className="m-0 mb-3 text-body font-medium leading-[1.45]">
        {trending.body}
      </p>
      <div className="flex flex-wrap items-center gap-2 text-caption text-muted">
        <button
          type="button"
          onClick={vote.toggle}
          aria-pressed={vote.hasVoted}
          aria-label={vote.hasVoted ? 'Remove upvote' : 'Upvote'}
          className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium tabular-nums transition-colors ${
            vote.hasVoted
              ? 'bg-lime/25 text-ink'
              : 'text-ink-soft hover:bg-pillow'
          }`}
        >
          <ChevronUp size={14} strokeWidth={2.5} /> {vote.count}
        </button>
        {trending.sessionTitle && <span>· from "{trending.sessionTitle}"</span>}
        {trending.followUps > 0 && (
          <span>
            · {trending.followUps} follow-up
            {trending.followUps === 1 ? '' : 's'}
          </span>
        )}
      </div>
    </Card>
  )
}

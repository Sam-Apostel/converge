import type { ReactNode } from 'react'

import {
  Avatar,
  AvatarStack,
  Badge,
  Card,
  Mono,
  VoteControl,
} from '#/components/ui'
import type {
  DiscussionAuthor,
  DiscussionThread,
  ThreadPost,
} from '#/lib/queries/discussions'

import { MeetupCard } from './meetup-card'

/** A thread is "live" enough to have spun out a meetup once a few people join. */
function becameMeetup(thread: DiscussionThread) {
  return thread.participants.length >= 3
}

function AuthorLine({
  author,
  meta,
  badge,
}: {
  author: DiscussionAuthor
  meta?: string
  badge?: React.ReactNode
}) {
  return (
    <div className="mb-2 flex items-center gap-2.5">
      <Avatar name={author.name} src={author.image} size={30} />
      <span className="text-[13.5px] font-semibold">{author.name}</span>
      {badge}
      {meta && <Mono tone="ghost" className="!text-[12px]">{meta}</Mono>}
    </div>
  )
}

function Post({
  post,
  participants,
}: {
  post: ThreadPost
  participants: Array<DiscussionAuthor>
}) {
  const badge = post.author.isSpeaker ? (
    <Badge tone="lime-soft">SPEAKER</Badge>
  ) : undefined
  const meta = !post.author.isSpeaker && post.isFollowUp ? 'follow-up' : undefined

  // Everyone but this post's author, as the "more voices in here" stack.
  const others = participants.filter((p) => p.id !== post.author.id)

  return (
    <div>
      <AuthorLine author={post.author} meta={meta} badge={badge} />
      <p className="m-0 text-[14.5px] leading-[1.5] text-[#3a3e54]">{post.body}</p>
      {post.replyCount > 0 && others.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <AvatarStack
            people={others.map((p) => ({ name: p.name, src: p.image }))}
            size={26}
            max={3}
          />
          <span className="text-[13px] text-[#8186a0]">
            +{post.replyCount} {post.replyCount === 1 ? 'reply' : 'replies'} in this
            thread
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * The Q → Answer → Follow-up → Community spine for a single discussion, with the
 * meetup outcome at the foot once the thread has drawn a crowd. Used both for the
 * featured thread on the index and the standalone thread page.
 */
export function Thread({
  thread,
  headerRight,
}: {
  thread: DiscussionThread
  /** Optional slot on the right of the eyebrow — e.g. an "Open thread" link. */
  headerRight?: ReactNode
}) {
  const { question, posts } = thread

  // With a real question row it's the headline; otherwise the opening post is.
  const opener = question
    ? { author: question.author, body: question.body, upvotes: question.upvotes }
    : posts[0]
      ? { author: posts[0].author, body: posts[0].body, upvotes: null }
      : null
  const spine = question ? posts : posts.slice(1)

  const eyebrow = thread.sessionTitle
    ? `Thread · from "${thread.sessionTitle}"`
    : 'Thread'

  return (
    <Card surface="white" className="p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Mono tone="ghost" className="!text-[11.5px]">
          {eyebrow}
        </Mono>
        {headerRight}
      </div>

      {opener && (
        <div className="mb-2 flex gap-3.5">
          {opener.upvotes != null && (
            <VoteControl count={opener.upvotes} downvote />
          )}
          <div className="flex-1">
            {opener.author && (
              <AuthorLine
                author={opener.author}
                meta={
                  opener.author.company
                    ? `${opener.author.company} · asked live`
                    : 'asked live'
                }
              />
            )}
            <p className="m-0 text-[16px] leading-[1.45] tracking-[-0.01em]">
              {opener.body}
            </p>
          </div>
        </div>
      )}

      {spine.length > 0 && (
        <div className="ml-[11px] mt-3.5 flex flex-col gap-[18px] border-l-2 border-inner pl-[25px]">
          {spine.map((post) => (
            <Post key={post.id} post={post} participants={thread.participants} />
          ))}
        </div>
      )}

      {becameMeetup(thread) && <MeetupCard thread={thread} />}
    </Card>
  )
}

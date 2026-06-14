import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { ArrowRight } from 'lucide-react'

import { Badge, Button, VoteControl } from '#/components/ui'
import { Thread } from '#/components/discussion'
import {
  promoteQuestion,
  questionsCollection,
  type QuestionAnswer,
  type SessionQuestion,
} from '#/db-collections/questions'
import { useEventStream } from '#/hooks/use-event-stream'
import { cn } from '#/lib/utils'
import type { DiscussionThread } from '#/lib/queries/discussions'

/** Upvotes at which a question earns the "keep this going" promote affordance. */
const PROMOTE_THRESHOLD = 3

type Viewer = { id: string; name: string; image: string | null }
type QuestionsCollection = ReturnType<typeof questionsCollection>

/** The SSR question shape from the session loader — the pre-mount fallback. */
export type SessionQuestionSeed = {
  id: string
  body: string
  upvotes: number
  authorName: string
  authorCompany: string | null
  createdAt: string | Date
}

function timeAgo(value: string | Date): string {
  const then = new Date(value).getTime()
  const mins = Math.max(0, Math.round((Date.now() - then) / 60_000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

/**
 * The tab strip under the live slide. "Live questions" shows the session's
 * real `question` rows (optimistic + realtime) with upvotes, answers and the
 * promote-to-discussion flow; "Discussion" renders the talk's linked thread.
 */
export function QuestionList({
  sessionId,
  questions,
  discussion,
  me,
  viewerIsSpeaker,
}: {
  sessionId: string
  questions: Array<SessionQuestionSeed>
  discussion: DiscussionThread | null
  me: Viewer | null
  viewerIsSpeaker: boolean
}) {
  const [tab, setTab] = useState<'qa' | 'discussion'>('qa')

  // The live collection is client-only — render the SSR list until mounted.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="mt-[22px]">
      <div className="mb-4 flex gap-[22px] border-b border-edge/16">
        <TabButton active={tab === 'qa'} onClick={() => setTab('qa')}>
          Live questions
        </TabButton>
        <TabButton
          active={tab === 'discussion'}
          onClick={() => setTab('discussion')}
        >
          Discussion
        </TabButton>
        <span className="pb-[11px] text-body font-medium text-faint">
          Notes
        </span>
        {tab === 'qa' && (
          <span className="ml-auto self-center text-caption text-muted">
            sorted by votes
          </span>
        )}
      </div>

      {tab === 'qa' ? (
        mounted && me ? (
          <LiveQuestions
            sessionId={sessionId}
            me={me}
            viewerIsSpeaker={viewerIsSpeaker}
          />
        ) : (
          <StaticQuestions questions={questions} />
        )
      ) : (
        <DiscussionTab discussion={discussion} />
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active || undefined}
      className={cn(
        'pb-[11px] text-body font-medium text-faint',
        'transition-colors hover:text-ink',
        'data-active:border-b-2 data-active:border-ink data-active:font-semibold data-active:text-ink',
      )}
    >
      {children}
    </button>
  )
}

/** Read-only SSR render, shown until the optimistic collection mounts. */
function StaticQuestions({
  questions,
}: {
  questions: Array<SessionQuestionSeed>
}) {
  if (questions.length === 0) {
    return (
      <p className="text-note text-mist">
        No questions yet — be the first to ask.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-[11px]">
      {questions.map((q) => (
        <div key={q.id} className="flex items-start gap-[13px]">
          <VoteControl count={q.upvotes} />
          <div className="flex-1">
            <p className="text-body leading-[1.4]">{q.body}</p>
            <div className="mt-1 font-mono text-caption text-faint">
              {q.authorName}
              {q.authorCompany ? ` · ${q.authorCompany}` : ''} ·{' '}
              {timeAgo(q.createdAt)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** The live, interactive Q&A: ask box + optimistic list + realtime refresh. */
function LiveQuestions({
  sessionId,
  me,
  viewerIsSpeaker,
}: {
  sessionId: string
  me: Viewer
  viewerIsSpeaker: boolean
}) {
  const collection = useMemo(() => questionsCollection(sessionId), [sessionId])
  const { data } = useLiveQuery(() => collection, [collection])

  // Other tabs/devices: pull the latest when a question is published.
  const onEvent = useCallback(
    (type: string) => {
      if (type === 'question.created') collection.utils.refetch()
    },
    [collection],
  )
  useEventStream({ channel: `session:${sessionId}`, onEvent })

  const questions = useMemo(
    () =>
      [...(data ?? [])].sort(
        (a, b) =>
          b.upvotes - a.upvotes ||
          (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0),
      ),
    [data],
  )

  const [draft, setDraft] = useState('')
  const ask = useCallback(() => {
    const body = draft.trim()
    if (!body) return
    collection.insert({
      id: crypto.randomUUID(),
      sessionId,
      authorId: me.id,
      body,
      status: 'open',
      upvotes: 0,
      hasVoted: false,
      promotedDiscussionId: null,
      createdAt: new Date().toISOString(),
      authorName: me.name,
      authorImage: me.image,
      authorCompany: null,
      answers: [],
    })
    setDraft('')
  }, [draft, collection, sessionId, me])

  const toggleVote = useCallback(
    (q: SessionQuestion) => {
      collection.update(q.id, (d) => {
        const next = !d.hasVoted
        d.hasVoted = next
        d.upvotes += next ? 1 : -1
      })
    },
    [collection],
  )

  return (
    <div>
      <AskBox value={draft} onChange={setDraft} onSubmit={ask} />

      {questions.length === 0 ? (
        <p className="mt-3.5 text-note text-mist">
          No questions yet — be the first to ask.
        </p>
      ) : (
        <div className="mt-3.5 flex flex-col gap-4">
          {questions.map((q) => (
            <QuestionRow
              key={q.id}
              q={q}
              sessionId={sessionId}
              me={me}
              viewerIsSpeaker={viewerIsSpeaker}
              collection={collection}
              onVote={() => toggleVote(q)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AskBox({
  value,
  onChange,
  onSubmit,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="flex gap-2"
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ask a question…"
        aria-label="Ask a question"
        className={cn(
          'flex-1 px-3.5 py-2 text-body',
          'rounded-[11px] border border-edge/22 bg-white outline-none',
          'transition-colors',
          'placeholder:text-faint focus:border-ink/40',
        )}
      />
      <Button type="submit" size="sm" variant="dark" disabled={!value.trim()}>
        Ask
      </Button>
    </form>
  )
}

function QuestionRow({
  q,
  sessionId,
  me,
  viewerIsSpeaker,
  collection,
  onVote,
}: {
  q: SessionQuestion
  sessionId: string
  me: Viewer
  viewerIsSpeaker: boolean
  collection: QuestionsCollection
  onVote: () => void
}) {
  const navigate = useNavigate()
  const [reply, setReply] = useState('')
  const [promoting, setPromoting] = useState(false)

  const submitReply = useCallback(() => {
    const body = reply.trim()
    if (!body) return
    collection.update(q.id, (d) => {
      d.answers = [
        ...d.answers,
        {
          id: crypto.randomUUID(),
          body,
          fromSpeaker: viewerIsSpeaker,
          authorId: me.id,
          authorName: me.name,
          authorImage: me.image,
          createdAt: new Date().toISOString(),
        },
      ]
    })
    setReply('')
  }, [reply, collection, q.id, me, viewerIsSpeaker])

  const promote = useCallback(async () => {
    setPromoting(true)
    const discussionId = await promoteQuestion(sessionId, q.id)
    setPromoting(false)
    if (discussionId) {
      navigate({ to: '/discussions/$id', params: { id: discussionId } })
    }
  }, [sessionId, q.id, navigate])

  return (
    <div className="flex items-start gap-[13px]">
      <VoteControl count={q.upvotes} onUpvote={onVote} active={q.hasVoted} />
      <div className="flex-1">
        <p className="text-body leading-[1.4]">{q.body}</p>
        <div className="mt-1 font-mono text-caption text-faint">
          {q.authorName}
          {q.authorCompany ? ` · ${q.authorCompany}` : ''} ·{' '}
          {timeAgo(q.createdAt)}
        </div>

        {q.answers.length > 0 && (
          <div className="mt-2.5 flex flex-col gap-2">
            {q.answers.map((a) => (
              <AnswerRow key={a.id} answer={a} />
            ))}
          </div>
        )}

        <ReplyBox
          value={reply}
          onChange={setReply}
          onSubmit={submitReply}
          isSpeaker={viewerIsSpeaker}
        />

        {q.promotedDiscussionId ? (
          <Link
            to="/discussions/$id"
            params={{ id: q.promotedDiscussionId }}
            className="mt-2 inline-flex"
          >
            <Badge tone="lime-soft">
              Continued in discussion <ArrowRight size={13} />
            </Badge>
          </Link>
        ) : q.upvotes >= PROMOTE_THRESHOLD ? (
          <button
            type="button"
            onClick={promote}
            disabled={promoting}
            className={cn(
              'mt-2 inline-flex items-center gap-1',
              'text-note font-semibold text-ink/75',
              'transition-colors hover:text-ink disabled:opacity-50',
            )}
          >
            Keep this conversation going <ArrowRight size={14} />
          </button>
        ) : null}
      </div>
    </div>
  )
}

function AnswerRow({ answer }: { answer: QuestionAnswer }) {
  return (
    <div
      data-from-speaker={answer.fromSpeaker || undefined}
      className={cn(
        'px-3 py-2',
        'rounded-[11px] bg-inner',
        'data-from-speaker:border data-from-speaker:border-lime/40 data-from-speaker:bg-lime/15',
      )}
    >
      <div className="mb-0.5 flex items-center gap-2">
        <span className="text-note font-semibold">{answer.authorName}</span>
        {answer.fromSpeaker && <Badge tone="lime-soft">SPEAKER</Badge>}
        <span className="font-mono text-tiny text-faint">
          {timeAgo(answer.createdAt)}
        </span>
      </div>
      <p className="text-note leading-body text-ink-soft">{answer.body}</p>
    </div>
  )
}

function ReplyBox({
  value,
  onChange,
  onSubmit,
  isSpeaker,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  isSpeaker: boolean
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="mt-2 flex gap-2"
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isSpeaker ? 'Answer as speaker…' : 'Reply…'}
        aria-label="Reply to question"
        className={cn(
          'flex-1 px-3 py-1.5 text-note',
          'rounded-[10px] border border-edge/22 bg-white outline-none',
          'transition-colors',
          'placeholder:text-faint focus:border-ink/40',
        )}
      />
      <Button type="submit" size="sm" variant="soft" disabled={!value.trim()}>
        {isSpeaker ? 'Answer' : 'Reply'}
      </Button>
    </form>
  )
}

/** The Discussion tab: the talk's linked thread inline, plus a link out. */
function DiscussionTab({
  discussion,
}: {
  discussion: DiscussionThread | null
}) {
  if (!discussion) {
    return (
      <p className="text-note text-mist">
        No discussion yet — promote a question with enough upvotes to start one.
      </p>
    )
  }
  return (
    <Thread
      thread={discussion}
      headerRight={
        <Link
          to="/discussions/$id"
          params={{ id: discussion.id }}
          className={cn(
            'inline-flex items-center gap-1',
            'text-note font-semibold text-mist',
            'transition-colors hover:text-ink',
          )}
        >
          Open full thread <ArrowRight size={14} />
        </Link>
      }
    />
  )
}

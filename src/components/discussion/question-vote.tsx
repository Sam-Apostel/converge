import { useState } from 'react'

import { VoteControl } from '#/components/ui'

/**
 * Self-contained upvote toggle for a question rendered outside the live Q&A
 * collection (discussion thread openers, the trending card). Flips
 * optimistically, then reconciles against the authoritative count from
 * `POST /api/questions/:id/vote`; reverts on failure (e.g. a signed-out 401).
 */
export function useQuestionVote(
  questionId: string,
  initial: { count: number; hasVoted: boolean },
) {
  const [state, setState] = useState(initial)
  const [pending, setPending] = useState(false)

  const toggle = async () => {
    if (pending) return
    setPending(true)
    const prev = state
    setState({
      count: prev.count + (prev.hasVoted ? -1 : 1),
      hasVoted: !prev.hasVoted,
    })
    try {
      const res = await fetch(`/api/questions/${questionId}/vote`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error(`vote -> ${res.status}`)
      const data = (await res.json()) as {
        voteCount: number
        hasVoted: boolean
      }
      setState({ count: data.voteCount, hasVoted: data.hasVoted })
    } catch {
      setState(prev)
    } finally {
      setPending(false)
    }
  }

  return { count: state.count, hasVoted: state.hasVoted, toggle }
}

/** `VoteControl` wired to the vote endpoint for a single question. */
export function QuestionVote({
  questionId,
  count,
  hasVoted,
  downvote = false,
}: {
  questionId: string
  count: number
  hasVoted: boolean
  downvote?: boolean
}) {
  const vote = useQuestionVote(questionId, { count, hasVoted })
  return (
    <VoteControl
      count={vote.count}
      active={vote.hasVoted}
      onUpvote={vote.toggle}
      downvote={downvote}
    />
  )
}

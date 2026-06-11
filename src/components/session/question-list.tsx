import { VoteControl } from '#/components/ui'

export type SessionQuestion = {
  id: string
  body: string
  upvotes: number
  status: string
  createdAt: string | Date
  authorName: string
  authorCompany: string | null
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
 * The tab strip under the live slide. "Live questions" shows the session's real
 * `question` rows, hottest first; Discussion and Notes are the sibling surfaces
 * other silos own.
 */
export function QuestionList({
  questions,
}: {
  questions: Array<SessionQuestion>
}) {
  return (
    <div className="mt-[22px]">
      <div className="mb-4 flex gap-[22px] border-b border-[rgba(120,130,180,.16)]">
        <span className="border-b-2 border-ink pb-[11px] text-sm font-semibold">
          Live questions
        </span>
        <span className="pb-[11px] text-sm font-medium text-faint">
          Discussion
        </span>
        <span className="pb-[11px] text-sm font-medium text-faint">Notes</span>
        <span className="ml-auto self-center text-[12.5px] text-[#8186a0]">
          sorted by votes
        </span>
      </div>

      {questions.length === 0 ? (
        <p className="text-[13.5px] text-mist">
          No questions yet — be the first to ask.
        </p>
      ) : (
        <div className="flex flex-col gap-[11px]">
          {questions.map((q) => (
            <div key={q.id} className="flex items-start gap-[13px]">
              <VoteControl count={q.upvotes} />
              <div className="flex-1">
                <p className="text-[14.5px] leading-[1.4]">{q.body}</p>
                <div className="mt-1 font-mono text-[12px] text-faint">
                  {q.authorName}
                  {q.authorCompany ? ` · ${q.authorCompany}` : ''} ·{' '}
                  {timeAgo(q.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

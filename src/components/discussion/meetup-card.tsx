import { Check, Coffee } from 'lucide-react'
import { useState } from 'react'

import { AvatarStack, Button, Mono, Spotlight } from '#/components/ui'
import { useSession } from '#/lib/auth-client'
import type { DiscussionThread } from '#/lib/queries/discussions'

function humanizeTopic(topic: string): string {
  return topic
    .split('-')
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(' ')
}

/**
 * The "this thread became a meetup" outcome card — the lime-glow payoff at the
 * bottom of an active thread. Attendees are the thread's real participants.
 */
export function MeetupCard({ thread }: { thread: DiscussionThread }) {
  const { data: session } = useSession()
  const [joined, setJoined] = useState(false)

  const title = thread.topic
    ? `Coffee: ${humanizeTopic(thread.topic)}`
    : `Coffee: ${thread.title}`

  // Attendees are the thread's participants; once you join, you slot in too —
  // unless you're already in the thread (then Join just confirms your spot).
  const me = session?.user
  const alreadyIn = me ? thread.participants.some((p) => p.id === me.id) : false
  const attendees = thread.participants.map((p) => ({ name: p.name, src: p.image }))
  if (joined && me && !alreadyIn) {
    attendees.push({ name: me.name, src: me.image ?? null })
  }

  return (
    <Spotlight className="mt-5 px-5 py-[18px]">
      <div className="mb-2.5 flex items-center gap-2">
        <Coffee size={15} className="text-lime" />
        <Mono tone="lime" className="!text-[11px] !tracking-[0.08em]">
          This thread became a meetup
        </Mono>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[17px] font-semibold tracking-[-0.01em]">{title}</div>
          <div className="mt-1 font-mono text-[13px] text-[#b9bcd0]">
            Time and place TBC
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AvatarStack
            people={attendees}
            size={32}
            max={5}
            border="#15172a"
            overflowBg="#2a2d40"
          />
          <Button
            variant="lime"
            onClick={() => setJoined((v) => !v)}
            aria-pressed={joined}
          >
            {joined ? (
              <>
                <Check size={15} /> Joined
              </>
            ) : (
              'Join'
            )}
          </Button>
        </div>
      </div>
    </Spotlight>
  )
}

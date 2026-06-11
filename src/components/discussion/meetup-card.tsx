import { AvatarStack, Button, Mono, Spotlight } from '#/components/ui'
import type { DiscussionThread } from '#/lib/queries/discussions'

// No meetup table exists yet, so the time + place are derived deterministically
// from the thread id — stable per thread, illustrative until meetups are modeled.
// TODO(meetup): back this with a real meetup/RSVP table + attendee rows.
const TIMES = ['Today 14:30', 'Today 16:00', 'Tomorrow 09:30', 'Today 13:00']
const PLACES = ['Base Camp café', 'Atrium café', 'OSS Lounge', 'Rooftop bar']

function hash(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

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
  const h = hash(thread.id)
  const title = thread.topic
    ? `Coffee: ${humanizeTopic(thread.topic)}`
    : `Coffee: ${thread.title}`
  const when = `${TIMES[h % TIMES.length]} · ${PLACES[h % PLACES.length]}`

  return (
    <Spotlight className="mt-5 px-5 py-[18px]">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="text-[15px] text-lime">◎</span>
        <Mono tone="lime" className="!text-[11px] !tracking-[0.08em]">
          This thread became a meetup
        </Mono>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[17px] font-semibold tracking-[-0.01em]">{title}</div>
          <div className="mt-1 font-mono text-[13px] text-[#b9bcd0]">{when}</div>
        </div>
        <div className="flex items-center gap-3">
          <AvatarStack
            people={thread.participants.map((p) => ({
              name: p.name,
              src: p.image,
            }))}
            size={32}
            max={5}
            border="#15172a"
            overflowBg="#2a2d40"
          />
          <Button variant="lime">Join</Button>
        </div>
      </div>
    </Spotlight>
  )
}

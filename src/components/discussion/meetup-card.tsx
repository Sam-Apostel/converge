import { Check, Coffee } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'

import { AvatarStack, Button, Mono, Spotlight } from '#/components/ui'
import { useSession } from '#/lib/auth-client'
import { formatClock } from '#/lib/format'
import type { ThreadMeetup } from '#/lib/queries/discussions'

/**
 * The "this thread became a meetup" outcome card — the lime-glow payoff at the
 * bottom of a thread that spun out a real meetup. Title, time, place and
 * attendees come from the `meetup` row; "Join" RSVPs the viewer.
 */
export function MeetupCard({ meetup }: { meetup: ThreadMeetup }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [joined, setJoined] = useState(meetup.viewerAttending)
  const [busy, setBusy] = useState(false)

  const me = session?.user
  const alreadyListed = me
    ? meetup.attendees.some((a) => a.id === me.id)
    : false
  const attendees = meetup.attendees.map((a) => ({
    name: a.name,
    src: a.image,
  }))
  if (joined && me && !alreadyListed) {
    attendees.push({ name: me.name, src: me.image ?? null })
  }

  const when = meetup.startsAt ? formatClock(meetup.startsAt) : null
  const place = meetup.location

  const join = async () => {
    if (!me || joined || busy) return
    setBusy(true)
    setJoined(true) // optimistic
    try {
      const res = await fetch(`/api/meetups/${meetup.id}/rsvp`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error(`rsvp -> ${res.status}`)
      router.invalidate()
    } catch {
      setJoined(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Spotlight className="mt-5 px-5 py-[18px]">
      <div className="mb-2.5 flex items-center gap-2">
        <Coffee size={15} className="text-lime" />
        <Mono tone="lime" className="!text-tiny !tracking-[0.08em]">
          This thread became a meetup
        </Mono>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[17px] font-semibold tracking-snug">
            {meetup.title}
          </div>
          <div className="mt-1 font-mono text-note text-frost">
            {[when, place].filter(Boolean).join(' · ') || 'Time and place TBC'}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {attendees.length > 0 && (
            <AvatarStack
              people={attendees}
              size={32}
              max={5}
              border="#15172a"
              overflowBg="#2a2d40"
            />
          )}
          <Button
            variant="lime"
            onClick={() => void join()}
            disabled={!me || busy}
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

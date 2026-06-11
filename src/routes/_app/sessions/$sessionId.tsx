import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'

import { Avatar } from '#/components/ui'
import { LiveProgress } from '#/components/session/live-progress'
import { LiveSlide } from '#/components/session/live-slide'
import {
  MomentsRail,
  type MomentView,
  type RelatedPerson,
  type RelatedProject,
} from '#/components/session/moments-rail'
import { QuestionList } from '#/components/session/question-list'
import { SpeakerSocials } from '#/components/session/speaker-socials'
import {
  INITIAL_SLIDE,
  SLIDES,
  SLIDE_MS,
  formatOffset,
  talkFraction,
} from '#/components/session/slides'
import { Toast } from '#/components/session/toast'
import { momentsCollection } from '#/db-collections/moments'
import { useEventStream } from '#/hooks/use-event-stream'
import { getSessionDetail } from '#/lib/queries/sessions'

export const Route = createFileRoute('/_app/sessions/$sessionId')({
  loader: ({ params }) => getSessionDetail({ data: params.sessionId }),
  component: SessionScreen,
})

function SessionScreen() {
  const { sessionId } = Route.useParams()
  const detail = Route.useLoaderData()

  const collection = useMemo(() => momentsCollection(sessionId), [sessionId])

  // The playhead walks the deck; every capture advances it one slide.
  const [playhead, setPlayhead] = useState(INITIAL_SLIDE)
  const [toast, setToast] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Collections are client-only — gate the live rail until after mount.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    },
    [],
  )

  const capture = useCallback(() => {
    const slide = SLIDES[playhead - 1]
    collection.insert({
      id: crypto.randomUUID(),
      sessionId,
      userId: 'me', // TODO(auth): the server assigns the real viewer
      timestampMs: Math.round(slide.n * SLIDE_MS),
      slideRef: `#${slide.n}`,
      transcriptSnippet: slide.topic,
      note: null,
      aiHighlight: false,
      createdAt: new Date(),
    })
    setPlayhead((n) => Math.min(SLIDES.length, n + 1))
    setToast(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(false), 2200)
  }, [collection, playhead, sessionId])

  const remove = useCallback(
    (id: string) => {
      collection.delete(id)
    },
    [collection],
  )

  if (!detail) {
    return (
      <div className="rounded-2xl border border-dashed border-black/10 bg-white/60 p-8 text-center text-sm text-muted">
        Session not found.{' '}
        <Link to="/sessions" className="text-ink underline">
          Back to the schedule
        </Link>
        .
      </div>
    )
  }

  const { session, speaker, questions, relatedPeople, relatedProject } = detail
  const slide = SLIDES[playhead - 1]

  return (
    <div className="relative overflow-hidden rounded-[30px] [background:linear-gradient(180deg,#fbfcff,#f3f5fc)] [box-shadow:0_2px_8px_rgba(40,50,110,.05),0_30px_70px_rgba(40,50,110,.13),inset_0_1px_0_rgba(255,255,255,.9)]">
      <LiveProgress
        title={session.title}
        roomName={session.roomName}
        startsAt={session.startsAt}
        endsAt={session.endsAt}
        fraction={talkFraction(playhead)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr]">
        {/* Left — the talk */}
        <div className="border-r border-[rgba(120,130,180,.12)] px-[26px] pb-[30px] pt-[26px]">
          <h1 className="mb-3.5 text-[28px] font-semibold leading-[1.08] tracking-[-0.03em]">
            {session.title}
          </h1>

          {speaker ? (
            <div className="mb-[22px] flex items-center gap-[11px]">
              <Avatar name={speaker.name} src={speaker.image} size={38} />
              <div>
                <div className="text-[14.5px] font-semibold">
                  {speaker.name}
                </div>
                <div className="text-[12.5px] text-[#8186a0]">
                  {[speaker.title, speaker.company]
                    .filter(Boolean)
                    .join(' · ') || 'Speaker'}
                </div>
              </div>
              <SpeakerSocials socials={speaker.socials} />
            </div>
          ) : null}

          <LiveSlide slide={slide} total={SLIDES.length} onBookmark={capture} />

          <QuestionList questions={questions} />
        </div>

        {/* Right — moments rail + context */}
        {mounted ? (
          <LiveRail
            collection={collection}
            sessionId={sessionId}
            relatedPeople={relatedPeople}
            relatedProject={relatedProject}
            onRemove={remove}
          />
        ) : (
          <MomentsRail
            moments={[]}
            ready={false}
            relatedPeople={relatedPeople}
            relatedProject={relatedProject}
            onRemove={remove}
          />
        )}
      </div>

      <Toast show={toast} label="Moment saved to your rail" />
    </div>
  )
}

/** Client-only wrapper: subscribes to the optimistic moments collection. */
function LiveRail({
  collection,
  sessionId,
  relatedPeople,
  relatedProject,
  onRemove,
}: {
  collection: ReturnType<typeof momentsCollection>
  sessionId: string
  relatedPeople: Array<RelatedPerson>
  relatedProject: RelatedProject | null
  onRemove: (id: string) => void
}) {
  const { data } = useLiveQuery((q) => q.from({ moment: collection }))

  // Other tabs/devices: pull the latest when a moment is published.
  const onEvent = useCallback(
    (type: string) => {
      if (type === 'moment.created') collection.utils.refetch()
    },
    [collection],
  )
  useEventStream({ channel: `session:${sessionId}`, onEvent })

  const moments: Array<MomentView> = [...(data ?? [])]
    .sort((a, b) => a.timestampMs - b.timestampMs)
    .map((m) => ({
      id: m.id,
      time: formatOffset(m.timestampMs),
      slideRef: m.slideRef,
      topic: m.transcriptSnippet || m.note || 'Moment',
    }))

  return (
    <MomentsRail
      moments={moments}
      ready
      relatedPeople={relatedPeople}
      relatedProject={relatedProject}
      onRemove={onRemove}
    />
  )
}

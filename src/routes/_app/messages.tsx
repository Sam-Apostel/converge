import { useCallback, useEffect, useMemo, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { Card, Mono } from '#/components/ui'
import { ConnectionStrip } from '#/components/messages/connection-strip'
import { ThreadList } from '#/components/messages/thread-list'
import { Conversation } from '#/components/messages/conversation'
import { refetchMessages } from '#/db-collections/messages'
import { useEventStream } from '#/hooks/use-event-stream'
import { getMessagesData } from '#/lib/queries/messages'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/_app/messages')({
  validateSearch: (search: Record<string, unknown>) => ({
    // Deep-link to a conversation with this person (e.g. "Say hi" from /people).
    dm: typeof search.dm === 'string' ? search.dm : undefined,
  }),
  loader: () => getMessagesData(),
  component: MessagesPage,
})

function MessagesPage() {
  const { me, people, threads, connections } = Route.useLoaderData()
  const { dm } = Route.useSearch()
  const router = useRouter()

  const peopleById = useMemo(
    () => new Map(people.map((p) => [p.id, p])),
    [people],
  )

  // A `?dm=` deep link wins; otherwise the most recent thread, then a contact.
  const deepLinked = dm && peopleById.has(dm)
  const [selectedId, setSelectedId] = useState<string | null>(
    (deepLinked ? dm : null) ??
      threads[0]?.otherId ??
      connections.accepted[0]?.id ??
      null,
  )

  // On narrow viewports the list and the conversation can't share the screen —
  // navigate between them like a stack. A `?dm=` deep link opens the thread.
  const [mobilePane, setMobilePane] = useState<'list' | 'thread'>(
    deepLinked ? 'thread' : 'list',
  )

  // The collection (and thus the conversation pane) is client-only.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const markRead = useCallback(
    async (otherId: string) => {
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ me, with: otherId }),
      })
      router.invalidate()
    },
    [me, router],
  )

  const handleSelect = useCallback(
    (otherId: string) => {
      setSelectedId(otherId)
      setMobilePane('thread')
      const thread = threads.find((t) => t.otherId === otherId)
      if (thread && thread.unread > 0) markRead(otherId)
    },
    [threads, markRead],
  )

  const handleAccept = useCallback(
    async (contactId: string) => {
      await fetch('/api/connections', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'accept', me, contactId }),
      })
      router.invalidate()
    },
    [me, router],
  )

  // Realtime: incoming messages refresh unread counts + the open conversation.
  useEventStream({
    channel: `user:${me}`,
    onEvent: (type) => {
      if (type !== 'message.created') return
      refetchMessages(me)
      router.invalidate()
    },
  })

  const selected = selectedId ? peopleById.get(selectedId) : undefined

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
      <p className="mb-5 mt-1 max-w-2xl text-body text-mist">
        Direct messages and the connection graph that outlives the event. The
        conference ends. The network remains.
      </p>

      <div
        className={cn(
          'grid h-[calc(100vh-220px)] min-h-[460px] grid-cols-1 gap-5',
          'lg:grid-cols-[348px_1fr]',
        )}
      >
        {/* left — connections + threads */}
        <Card
          surface="white"
          className={cn(
            'flex-col overflow-hidden',
            mobilePane === 'thread' ? 'hidden lg:flex' : 'flex',
          )}
        >
          <ConnectionStrip
            connections={connections}
            onAccept={handleAccept}
            onOpen={handleSelect}
          />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ThreadList
              threads={threads}
              me={me}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          </div>
        </Card>

        {/* right — conversation */}
        <Card
          surface="white"
          className={cn(
            'flex-col overflow-hidden',
            mobilePane === 'list' ? 'hidden lg:flex' : 'flex',
          )}
        >
          {mounted && selected ? (
            <>
              <button
                type="button"
                onClick={() => setMobilePane('list')}
                className={cn(
                  'flex items-center gap-1.5 border-b border-edge/15 px-4 py-3',
                  'text-note font-medium text-slate lg:hidden',
                  'transition-colors hover:text-ink',
                )}
              >
                <ArrowLeft size={16} /> Conversations
              </button>
              <div className="min-h-0 flex-1">
                <Conversation
                  key={selected.id}
                  me={me}
                  other={selected}
                  onSent={() => router.invalidate()}
                />
              </div>
            </>
          ) : (
            <div className="grid h-full place-items-center">
              <Mono tone="ghost" className="!text-caption !tracking-[0.06em]">
                Select a conversation
              </Mono>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

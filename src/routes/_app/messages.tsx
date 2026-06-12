import { useCallback, useMemo, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'

import { Card, Mono } from '#/components/ui'
import { ConnectionStrip } from '#/components/messages/connection-strip'
import { ThreadList } from '#/components/messages/thread-list'
import { Conversation } from '#/components/messages/conversation'
import { refetchMessages } from '#/db-collections/messages'
import { useEventStream } from '#/hooks/use-event-stream'
import { getMessagesData } from '#/lib/queries/messages'

export const Route = createFileRoute('/_app/messages')({
  validateSearch: (search: Record<string, unknown>) => ({
    me: typeof search.me === 'string' ? search.me : undefined,
  }),
  loaderDeps: ({ search }) => ({ me: search.me }),
  loader: ({ deps }) => getMessagesData({ data: { me: deps.me } }),
  component: MessagesPage,
})

function MessagesPage() {
  const { me, people, threads, connections } = Route.useLoaderData()
  const router = useRouter()

  const peopleById = useMemo(
    () => new Map(people.map((p) => [p.id, p])),
    [people],
  )

  // Default to the most recent thread, then any accepted contact.
  const [selectedId, setSelectedId] = useState<string | null>(
    threads[0]?.otherId ?? connections.accepted[0]?.id ?? null,
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
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">Messages</h1>
      <p className="mb-5 mt-1 max-w-2xl text-[14.5px] text-mist">
        Direct messages and the connection graph that outlives the event. The
        conference ends. The network remains.
      </p>

      <div className="grid h-[calc(100vh-220px)] min-h-[460px] grid-cols-1 gap-5 lg:grid-cols-[348px_1fr]">
        {/* left — connections + threads */}
        <Card surface="white" className="flex flex-col overflow-hidden">
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
        <Card surface="white" className="overflow-hidden">
          {mounted && selected ? (
            <Conversation
              key={selected.id}
              me={me}
              other={selected}
              onSent={() => router.invalidate()}
            />
          ) : (
            <div className="grid h-full place-items-center">
              <Mono tone="ghost" className="!text-[12px] !tracking-[0.06em]">
                Select a conversation
              </Mono>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

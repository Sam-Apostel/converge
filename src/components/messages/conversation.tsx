import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from '@tanstack/react-db'

import { Avatar, Button, Card, Mono } from '#/components/ui'
import { cn } from '#/lib/utils'
import { messagesCollection } from '#/db-collections/messages'
import {
  conversationOf,
  relativeTime,
  type DirectoryPerson,
} from '#/components/messages/types'

/**
 * The right pane: the open conversation as bubbles plus a composer. Reads the
 * viewer's optimistic message collection and filters to the selected person, so
 * a sent message appears instantly and reconciles when the POST lands.
 */
export function Conversation({
  me,
  other,
  onSent,
}: {
  me: string
  other: DirectoryPerson
  onSent: () => void
}) {
  const { data } = useLiveQuery(() => messagesCollection(me), [me])
  const messages = conversationOf(data ?? [], me, other.id)

  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Keep the latest message in view.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, other.id])

  function send() {
    const body = draft.trim()
    if (!body) return
    messagesCollection(me).insert({
      id: crypto.randomUUID(),
      fromUserId: me,
      toUserId: other.id,
      body,
      readAt: null,
      createdAt: new Date().toISOString(),
    })
    setDraft('')
    onSent()
  }

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
        <Avatar
          name={other.name}
          src={other.image}
          size={38}
          dot={other.online ? 'online' : 'offline'}
        />
        <div className="min-w-0">
          <div className="truncate text-reading font-semibold text-ink">
            {other.name}
          </div>
          {other.handle && (
            <div className="truncate font-mono text-caption text-mist">
              @{other.handle}
            </div>
          )}
        </div>
        <div className="ml-auto">
          <Mono tone="ghost" className="!text-micro !tracking-[0.1em]">
            {other.online ? 'Online' : 'Offline'}
          </Mono>
        </div>
      </div>

      {/* messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-2.5 overflow-y-auto px-5 py-4"
      >
        {messages.length === 0 ? (
          <div className="grid h-full place-items-center text-center text-note text-mist">
            No messages yet — say hello.
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.fromUserId === me
            return (
              <div
                key={m.id}
                data-mine={mine || undefined}
                className="flex flex-col items-start data-mine:items-end"
              >
                {mine ? (
                  <div
                    className={cn(
                      'max-w-[78%] px-3.5 py-2',
                      'text-body leading-snug text-white',
                      'rounded-2xl rounded-br-md bg-ink',
                    )}
                  >
                    {m.body}
                  </div>
                ) : (
                  <Card
                    surface="inner"
                    className="max-w-[78%] rounded-bl-md px-3.5 py-2 text-body leading-snug"
                  >
                    {m.body}
                  </Card>
                )}
                <span className="mt-1 px-1 font-mono text-micro text-faint">
                  {relativeTime(m.createdAt)}
                </span>
              </div>
            )
          })
        )}
      </div>

      {/* composer */}
      <div className="flex items-center gap-2.5 border-t border-line px-4 py-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder={`Message ${other.name.split(' ')[0]}…`}
          className={cn(
            'h-11 flex-1 px-4',
            'text-body text-ink',
            'rounded-xl bg-pillow outline-none',
            'placeholder:text-faint',
            'focus:ring-2 focus:ring-lime/40',
          )}
        />
        <Button variant="lime" onClick={send} disabled={!draft.trim()}>
          Send
        </Button>
      </div>
    </div>
  )
}

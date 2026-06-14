import { Avatar, Badge } from '#/components/ui'
import { cn } from '#/lib/utils'
import { relativeTime, type Thread } from '#/components/messages/types'

/** The left pane: one row per conversation, newest first. */
export function ThreadList({
  threads,
  me,
  selectedId,
  onSelect,
}: {
  threads: Array<Thread>
  me: string
  selectedId: string | null
  onSelect: (otherId: string) => void
}) {
  if (threads.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-note text-mist">
        No conversations yet. Say hello to a connection to start one.
      </div>
    )
  }

  return (
    <ul className="flex flex-col">
      {threads.map((thread) => {
        const active = thread.otherId === selectedId
        const mine = thread.lastMessage.fromUserId === me
        return (
          <li key={thread.otherId}>
            <button
              type="button"
              onClick={() => onSelect(thread.otherId)}
              data-active={active || undefined}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3 text-left',
                'transition-colors',
                'hover:bg-inner',
                'data-active:bg-pillow data-active:hover:bg-pillow',
              )}
            >
              <Avatar
                name={thread.other.name}
                src={thread.other.image}
                size={42}
                dot={thread.other.online ? 'online' : 'offline'}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-body font-semibold text-ink">
                    {thread.other.name}
                  </span>
                  <span className="ml-auto shrink-0 font-mono text-tiny tabular-nums text-faint">
                    {relativeTime(thread.lastMessage.createdAt)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span
                    data-unread={thread.unread > 0 || undefined}
                    className={cn(
                      'truncate text-note text-mist',
                      'data-unread:font-medium data-unread:text-slate',
                    )}
                  >
                    {mine && <span className="text-faint">You: </span>}
                    {thread.lastMessage.body}
                  </span>
                  {thread.unread > 0 && (
                    <Badge
                      tone="lime"
                      className="ml-auto shrink-0 tabular-nums"
                    >
                      {thread.unread}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

import { Avatar, AvatarStack, Button, Mono } from '#/components/ui'
import type { Connections } from '#/components/messages/types'

/**
 * The connections strip above the thread list: incoming requests to accept and
 * the contacts you've already connected with.
 */
export function ConnectionStrip({
  connections,
  onAccept,
  onOpen,
}: {
  connections: Connections
  onAccept: (contactId: string) => void
  onOpen: (contactId: string) => void
}) {
  const { pending, accepted } = connections
  if (pending.length === 0 && accepted.length === 0) return null

  return (
    <div className="border-b border-line px-4 py-3.5">
      {pending.length > 0 && (
        <div className="mb-3">
          <Mono tone="slate" className="!text-tiny !tracking-[0.08em]">
            Requests · {pending.length}
          </Mono>
          <ul className="mt-2 flex flex-col gap-2">
            {pending.map((req) => (
              <li key={req.id} className="flex items-center gap-2.5">
                <Avatar
                  name={req.from.name}
                  src={req.from.image}
                  size={32}
                  dot={req.from.online ? 'online' : 'offline'}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-note font-medium text-ink">
                    {req.from.name}
                  </div>
                  {req.note && (
                    <div className="truncate text-caption text-mist">
                      {req.note}
                    </div>
                  )}
                </div>
                <Button
                  variant="lime"
                  size="sm"
                  onClick={() => onAccept(req.from.id)}
                >
                  Accept
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {accepted.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <Mono tone="slate" className="!text-tiny !tracking-[0.08em]">
            Connections · {accepted.length}
          </Mono>
          <div className="-mr-1 flex">
            {accepted.map((c) => (
              <button
                key={c.id}
                type="button"
                className="rounded-full p-0.5 transition-transform hover:-translate-y-px"
                onClick={() => onOpen(c.id)}
                title={`Message ${c.name}`}
              >
                <AvatarStack
                  people={[{ name: c.name, src: c.image }]}
                  size={30}
                  max={1}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

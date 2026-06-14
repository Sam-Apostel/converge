import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import {
  Notification,
  NotificationGroup,
} from '@progress/kendo-react-notification'

import { cn } from '#/lib/utils'

type NotifyFn = (
  message: string,
  opts?: { icon?: ReactNode; duration?: number },
) => void

type Item = { id: string; message: string; icon?: ReactNode }

const NotifyContext = createContext<NotifyFn>(() => {})

export const useNotify = () => useContext(NotifyContext)

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [items, setItems] = useState<Item[]>([])
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const notify = useCallback<NotifyFn>((message, opts = {}) => {
    const id = crypto.randomUUID()
    setItems((prev) => [...prev, { id, message, icon: opts.icon }])
    setTimeout(
      () => setItems((prev) => prev.filter((n) => n.id !== id)),
      opts.duration ?? 3000,
    )
  }, [])

  return (
    <NotifyContext.Provider value={notify}>
      {children}
      {mounted && (
        <NotificationGroup
          className={cn(
            'pointer-events-none fixed bottom-6 left-1/2 z-[9999]',
            'flex -translate-x-1/2 flex-col-reverse items-center gap-2',
          )}
        >
          {items.map((n) => (
            <Notification
              key={n.id}
              type={{ style: 'none', icon: false }}
              closable={false}
            >
              <div className="converge-toast">
                {n.icon && (
                  <span className="flex items-center text-lime">{n.icon}</span>
                )}
                {n.message}
              </div>
            </Notification>
          ))}
        </NotificationGroup>
      )}
    </NotifyContext.Provider>
  )
}

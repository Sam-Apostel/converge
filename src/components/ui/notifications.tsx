import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  Notification,
  NotificationGroup,
} from '@progress/kendo-react-notification'

type NotifyFn = (message: string, opts?: { icon?: string; duration?: number }) => void

type Item = { id: string; message: string; icon?: string }

const NotifyContext = createContext<NotifyFn>(() => {})

export const useNotify = () => useContext(NotifyContext)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
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
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column-reverse',
            alignItems: 'center',
            gap: 8,
            pointerEvents: 'none',
          }}
        >
          {items.map((n) => (
            <Notification
              key={n.id}
              type={{ style: 'none', icon: false }}
              closable={false}
            >
              <div className="converge-toast">
                {n.icon && (
                  <span className="text-[15px] text-lime">{n.icon}</span>
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

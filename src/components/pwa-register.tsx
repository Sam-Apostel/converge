import { useEffect } from 'react'

/**
 * Registers the service worker (`public/sw.js`) on the client, in production
 * only. Dev keeps the SW disabled so Vite HMR isn't served stale assets — and
 * proactively unregisters any SW left over from a prior production visit.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    if (!import.meta.env.PROD) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {})
      return
    }

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // Wait for load so the SW install doesn't compete with first paint.
    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })
  }, [])

  return null
}

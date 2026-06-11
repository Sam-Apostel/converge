/*
 * Converge service worker.
 *
 * Strategy:
 *  - Navigations: network-first, fall back to cached page, then /offline.html.
 *  - Static same-origin assets: stale-while-revalidate.
 *  - API / auth / MCP / non-GET: never cached (always hit the network).
 *
 * Bump CACHE_VERSION to invalidate old caches on the next activation.
 */
const CACHE_VERSION = 'v1'
const CACHE = `converge-${CACHE_VERSION}`
const OFFLINE_URL = '/offline.html'

const PRECACHE = [
  '/',
  OFFLINE_URL,
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
]

// Paths that must always go to the network (dynamic / authenticated).
const NETWORK_ONLY = [/^\/api\//, /^\/mcp/, /^\/\.well-known\//]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (NETWORK_ONLY.some((re) => re.test(url.pathname))) return

  // Navigations → network-first with offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request)
          const cache = await caches.open(CACHE)
          cache.put('/', fresh.clone())
          return fresh
        } catch {
          return (
            (await caches.match(request)) ||
            (await caches.match('/')) ||
            (await caches.match(OFFLINE_URL))
          )
        }
      })(),
    )
    return
  }

  // Static assets → stale-while-revalidate.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      const cached = await cache.match(request)
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            cache.put(request, res.clone())
          }
          return res
        })
        .catch(() => cached)
      return cached || network
    })(),
  )
})

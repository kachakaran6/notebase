// Notebase Service Worker for PWA Offline Caching & Installability
const CACHE_NAME = 'notebase-v2'
const ASSETS_TO_CACHE = [
  '/',
  '/notebase.png',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // Continue even if some resources fail to cache initially
      })
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Only handle HTTP/HTTPS GET requests
  if (event.request.method !== 'GET') return
  if (!event.request.url.startsWith('http')) return

  const url = new URL(event.request.url)

  // Skip API routes, auth, Next.js internal/dev routes, and external origins
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/_next/webpack-hmr') ||
    url.pathname.startsWith('/_next/static/webpack/') ||
    url.pathname.includes('__next') ||
    url.searchParams.has('_rsc') ||
    event.request.headers.get('RSC') === '1'
  ) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache valid basic responses
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone).catch(() => {})
          })
        }
        return response
      })
      .catch(async () => {
        try {
          const cachedResponse = await caches.match(event.request)
          if (cachedResponse) return cachedResponse

          // If offline and request is for navigation, fallback to cached root
          if (event.request.mode === 'navigate') {
            const fallback = await caches.match('/')
            if (fallback) return fallback
          }
        } catch {
          // ignore cache lookup errors
        }

        // CRITICAL: respondWith() MUST ALWAYS resolve to a valid Response instance, never undefined!
        return new Response('Network error occurred. Please check your connection.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' },
        })
      })
  )
})


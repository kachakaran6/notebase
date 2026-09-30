// Notebase Service Worker for PWA Offline Caching & Installability
const CACHE_NAME = 'notebase-v1'
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
  // Only cache GET requests
  if (event.request.method !== 'GET') return

  // Skip API routes, auth, and external requests
  const url = new URL(event.request.url)
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.origin !== self.location.origin
  ) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If good response, clone and cache
        if (response.status === 200) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse
          // If offline and request is for a page, fallback to cached root
          if (event.request.mode === 'navigate') {
            return caches.match('/')
          }
        })
      })
  )
})

// Nuply Service Worker — Offline support
const CACHE_NAME = 'nuply-v1'
const STATIC_CACHE = 'nuply-static-v1'
const API_CACHE = 'nuply-api-v1'

// Static assets to pre-cache
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
]

// ─── Install ─────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

// ─── Activate ────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    }).then(() => self.clients.claim())
  )
})

// ─── Fetch strategies ────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip auth/Supabase requests
  if (url.pathname.startsWith('/auth') || url.hostname.includes('supabase')) return

  // API routes — Network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    // Only cache safe read endpoints
    const cachableAPIs = [
      '/api/wedding-day-program',
    ]
    const isCachable = cachableAPIs.some(p => url.pathname.startsWith(p))
    if (!isCachable) return

    event.respondWith(networkFirstWithCache(request, API_CACHE))
    return
  }

  // Static assets (JS, CSS, images, fonts) — Cache first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstWithNetwork(request, STATIC_CACHE))
    return
  }

  // Pages — Network first with cache fallback
  if (request.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithCache(request, CACHE_NAME))
    return
  }
})

// ─── Strategies ──────────────────────────────────────────────────────────────

async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    // Return offline page if available
    if (request.headers.get('Accept')?.includes('text/html')) {
      return new Response(
        '<html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#F5F0F7"><div style="text-align:center"><h1 style="color:#823F91">Nuply</h1><p style="color:#6B7280">Vous êtes hors ligne. Reconnectez-vous pour continuer.</p></div></body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      )
    }
    throw new Error('Network unavailable')
  }
}

async function cacheFirstWithNetwork(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('', { status: 503 })
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|svg|gif|webp|avif|ico|woff|woff2|ttf|eot)$/i.test(pathname) ||
    pathname.startsWith('/_next/static/')
}

// ─── Background sync for messages ────────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'send-messages') {
    event.waitUntil(sendQueuedMessages())
  }
})

async function sendQueuedMessages() {
  // Messages are queued in IndexedDB by the client
  // This will be implemented when full offline messaging is needed
}

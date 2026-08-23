// Walli's Space World — simple offline-capable service worker
// All paths are relative to the SW's own location so the app works at any
// base URL (localhost root or a GitHub Pages subpath).
const CACHE = 'walli-space-v2'
const SHELL = ['./', './manifest.webmanifest', './app-icon.svg', './favicon.svg']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  )
  self.clients.claim()
})

// Network-first for navigation (so deploys show up), cache-first for hashed assets
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET' || url.origin !== location.origin) return

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => { caches.open(CACHE).then(c => c.put('./', res.clone())); return res })
        .catch(() => caches.match('./'))
    )
    return
  }

  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()))
      return res
    }))
  )
})

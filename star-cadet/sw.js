// Star Cadet service worker — cache-first so the game loads in aeroplane mode (spec §12).
const CACHE = 'sc-v3'

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/tokens.css',
  './css/base.css',
  './css/screens.css',
  './js/main.js',
  './js/router.js',
  './js/state.js',
  './js/audio.js',
  './js/facts.js',
  './js/mastery.js',
  './js/curriculum.js',
  './js/ui/hud.js',
  './js/ui/teach.js',
  './js/ui/toast.js',
  './js/ui/starburst.js',
  './js/ui/rocket.js',
  './js/screens/launchpad.js',
  './js/screens/galaxy.js',
  './js/screens/level.js',
  './js/screens/goodnight.js',
  './js/screens/tower.js',
  './js/screens/garage.js',
  './js/screens/stickers.js',
  './js/screens/parent.js',
  './js/screens/games/_base.js',
  './js/screens/games/index.js',
  './js/screens/games/asteroid.js',
  './js/screens/games/fuelpods.js',
  './js/screens/games/feedalien.js',
  './js/screens/games/starbridge.js',
  './js/screens/games/meteordodge.js',
  './js/screens/games/constellation.js',
  './js/screens/games/towerclimb.js',
  './js/screens/games/spacewhale.js',
  './icons/180.png',
  './icons/192.png',
  './icons/512.png',
  './icons/512-maskable.png',
]

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)

  // Google Fonts: cache-first with runtime fill, so type survives aeroplane mode.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'){
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        const copy = res.clone()
        caches.open(CACHE).then(c => c.put(e.request, copy))
        return res
      }).catch(() => new Response('', { status: 503 })))
    )
    return
  }

  if (url.origin !== location.origin) return

  // Same-origin: cache-first over the precached shell.
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok){
        const copy = res.clone()
        caches.open(CACHE).then(c => c.put(e.request, copy))
      }
      return res
    }))
  )
})

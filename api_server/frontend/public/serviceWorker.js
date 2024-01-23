const CACHE_NAME = 'site-cache-v3.0';
const toCache = [
    '/',
    '/index.html',
];
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(toCache)
      })
      .then(self.skipWaiting())
  )
})

self.addEventListener('fetch', function(event) {
  if((event.request.url.indexOf('http') === 0)) {
    event.respondWith(async function() {
      const cache = await caches.open(CACHE_NAME)
      const cacheMatch = await cache.match(event.request)
  
      if (navigator.onLine) {
        const request = fetch(event.request, {cache: 'no-store'})
  
        event.waitUntil(async function() {
          const response = await request
          try {
            await cache.put(event.request, response.clone())
          } catch (e) {
            console.error(e)
          }
        }())
  
        return cacheMatch || request
      }
  
      return cacheMatch
    }())
  }
})

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys()
      .then((keyList) => {
        return Promise.all(keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', key)
            return caches.delete(key)
          }
        }))
      })
      .then(() => self.clients.claim())
  )
})
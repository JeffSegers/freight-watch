// Freight Watch — minimal service worker (enables PWA installability)
const CACHE = 'fw-v1';
const SHELL = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network-first: always try live data, fall back to cache for the shell only
  if (e.request.url.includes('graph.microsoft.com') ||
      e.request.url.includes('login.microsoftonline.com') ||
      e.request.url.includes('alcdn.msauth.net')) {
    return; // let the browser handle auth/API calls normally
  }
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});

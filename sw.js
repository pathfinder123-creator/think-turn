const CACHE_PREFIX = `perspective-deck:${self.registration.scope}:`;
const CACHE_NAME = `${CACHE_PREFIX}b135d202728a`;
const APP_PATHS = [
  'index.html',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png'
];
const SCOPE = new URL(self.registration.scope);
const APP_URLS = APP_PATHS.map(path => new URL(path, SCOPE).href);
const PAGE_URL = APP_URLS[0];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache =>
    cache.addAll(APP_URLS.map(url => new Request(url, {cache: 'reload'})))
  ));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== SCOPE.origin) return;
  if (request.mode === 'navigate' &&
      (url.pathname === SCOPE.pathname || url.pathname === new URL(PAGE_URL).pathname)) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) return response;
        return (await (await caches.open(CACHE_NAME)).match(PAGE_URL)) || response;
      } catch {
        return (await (await caches.open(CACHE_NAME)).match(PAGE_URL)) || Response.error();
      }
    })());
    return;
  }
  if (APP_URLS.includes(url.href)) {
    event.respondWith((async () =>
      (await (await caches.open(CACHE_NAME)).match(request)) || fetch(request)
    )());
  }
});

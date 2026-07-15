// Service worker for the Kala Residency PWA shell.
// This ONLY caches the shell itself (this page, manifest, icons).
// The iframe's content comes from script.google.com (a different origin)
// and is never touched by this service worker — that's the browser's
// normal cross-origin isolation, so no special handling is needed for it.

const CACHE_NAME = 'kr-shell-v1'; // bump this on every shell update to bust old caches
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle GET requests for this shell's own origin.
  // Anything else (including the iframe's own network calls) is left alone.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

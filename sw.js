---
layout: null
sitemap: false
---
// Service worker: pages are fetched from the network first and kept for offline
// reading; files under /assets/ are served from the cache and refreshed in the
// background. Everything else (analytics, embeds) goes straight to the network.
// The cache name changes with every build, so a new deploy replaces old caches.

const CACHE = 'satranckahvesi-{{ site.time | date: "%s" }}';
const OFFLINE_URL = '{{ "/offline/" | relative_url }}';
const ASSETS = '{{ "/assets/" | relative_url }}';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function store(request, response) {
  if (response.ok && response.type === 'basic') {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    return await store(request, await fetch(request));
  } catch {
    return (await caches.match(request)) ?? (await caches.match(OFFLINE_URL));
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const refresh = fetch(request).then((response) => store(request, response));
  if (cached) {
    refresh.catch(() => {});
    return cached;
  }
  return refresh;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
  } else if (url.pathname.startsWith(ASSETS)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

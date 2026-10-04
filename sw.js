---
layout: null
sitemap: false
---
// Service worker: pages are fetched from the network first and kept for offline
// reading; files under /assets/ are served from the cache and refreshed in the
// background. Everything else (analytics, embeds) goes straight to the network.
// The cache name changes with every build, so a new deploy replaces old caches.
// Push messages ({title, body, url}, sent by scripts/send-push.mjs) are shown as
// notifications; tapping one opens its page.

const CACHE = 'satranckahvesi-{{ site.time | date: "%s" }}';
const OFFLINE_URL = '{{ "/offline/" | relative_url }}';
const ASSETS = '{{ "/assets/" | relative_url }}';
const ICON = '{{ "/assets/img/icon-192.png" | relative_url }}';

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

self.addEventListener('push', (event) => {
  let message = {};
  try {
    message = event.data ? event.data.json() : {};
  } catch {
    message = {};
  }
  event.waitUntil(
    self.registration.showNotification(message.title || 'Satranç Kahvesi', {
      body: message.body || '',
      icon: ICON,
      tag: message.url,
      data: { url: message.url }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/', self.location.origin);
  const url = target.origin === self.location.origin ? target.href : self.location.origin + '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => client.url === url && 'focus' in client);
      return open ? open.focus() : self.clients.openWindow(url);
    })
  );
});

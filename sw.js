---
layout: null
sitemap: false
---
// Service worker. Two caches:
//  - VISITED (fixed name, survives updates): pages the reader opened, fetched network-first
//    and kept for offline reading, plus other /assets/ files, served from the cache and
//    refreshed in the background. Trimmed to the most recent MAX_VISITED entries.
//  - SHELL (new name every build): the start page, the offline page and this build's CSS,
//    scripts, fonts and icons, stored at install so the installed app opens offline right
//    after an update. The previous SHELL is deleted when the new one activates.
// Everything else (analytics, embeds) goes straight to the network.
// Push messages ({title, body, url}, sent by scripts/send-push.mjs) are shown as
// notifications; tapping one opens its page.

const VERSION = '{{ site.time | date: "%s" }}';
const VISITED = 'satranckahvesi-visited';
const SHELL = 'satranckahvesi-shell-' + VERSION;
const MAX_VISITED = 120;
const OFFLINE_URL = '{{ "/offline/" | relative_url }}';
const ASSETS = '{{ "/assets/" | relative_url }}';
const ICON = '{{ "/assets/img/icon-192.png" | relative_url }}';
const PRECACHE = [
  '{{ "/" | relative_url }}',
  '{{ "/assets/css/site.css" | relative_url }}?v={{ site.time | date: "%s" }}',
  '{{ "/assets/js/site.js" | relative_url }}',
  '{{ "/assets/js/post.js" | relative_url }}',
  '{{ "/assets/img/icon-192.png" | relative_url }}',
  '{{ "/assets/img/favicon.svg" | relative_url }}',
  {%- for file in site.static_files %}{% if file.path contains "/assets/fonts/" %}
  '{{ file.path | relative_url }}',
  {%- endif %}{% endfor %}
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then(async (cache) => {
        await cache.add(OFFLINE_URL);
        // Best effort: one missing file must not stop the update.
        await Promise.allSettled(PRECACHE.map((url) => cache.add(url)));
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VISITED && key !== SHELL).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function store(request, response) {
  if (response.ok && response.type === 'basic') {
    const cache = await caches.open(VISITED);
    await cache.put(request, response.clone());
    // keys() lists the oldest entries first.
    const keys = await cache.keys();
    await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_VISITED)).map((key) => cache.delete(key)));
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

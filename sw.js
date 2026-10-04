---
layout: null
sitemap: false
---
// Service worker. Two caches:
//  - VISITED (fixed name, survives updates): pages the reader opened, fetched network-first
//    and kept for offline reading, plus other /assets/ files, served from the cache and
//    refreshed in the background. Trimmed to the most recent MAX_VISITED entries.
//  - OFFLINE (fixed name): every page listed in sitemap.xml and the images they use, stored
//    when the page asks for it ({type: 'sync-offline'}; it does so only inside the installed
//    app). Pages that left the sitemap are removed.
//  - SHELL (new name every build): the start page, the offline page and this build's CSS,
//    scripts, fonts and icons, stored at install so the installed app opens offline right
//    after an update. The previous SHELL is deleted when the new one activates.
// Everything else (analytics, embeds) goes straight to the network.
// Push messages ({title, body, url}, sent by scripts/send-push.mjs) are shown as
// notifications; tapping one opens its page.

const VERSION = '{{ site.time | date: "%s" }}';
const VISITED = 'satranckahvesi-visited';
const OFFLINE = 'satranckahvesi-offline';
const SHELL = 'satranckahvesi-shell-' + VERSION;
const MAX_VISITED = 120;
const OFFLINE_URL = '{{ "/offline/" | relative_url }}';
const ASSETS = '{{ "/assets/" | relative_url }}';
const ICON = '{{ "/assets/img/icon-192.png" | relative_url }}';
const SITEMAP = '{{ "/sitemap.xml" | relative_url }}';
const IMAGES = new RegExp(ASSETS.replace(/\//g, '\\/') + 'img\\/[^"\'\\s)<>]+', 'g');
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
      .then((keys) => Promise.all(keys.filter((key) => key !== VISITED && key !== OFFLINE && key !== SHELL).map((key) => caches.delete(key))))
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

// Downloads every page in the sitemap and the images they use into OFFLINE. Resolves to
// true only when everything was fetched.
async function syncOffline() {
  const sitemap = await (await fetch(SITEMAP, { cache: 'no-cache' })).text();
  const pages = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1].trim()).pathname))];
  if (pages.length === 0) return false;

  const cache = await caches.open(OFFLINE);
  const images = new Set();
  const wanted = new Set();
  let failed = false;

  async function download(path, isPage) {
    try {
      const response = await fetch(path, { cache: 'no-cache' });
      if (!response.ok) throw new Error(String(response.status));
      wanted.add(path);
      const copy = response.clone();
      await cache.put(path, response);
      if (isPage) for (const image of (await copy.text()).match(IMAGES) ?? []) images.add(image);
    } catch {
      failed = true;
    }
  }

  async function run(paths, isPage) {
    const queue = [...paths];
    await Promise.all(Array.from({ length: 4 }, async () => {
      while (queue.length) await download(queue.shift(), isPage);
    }));
  }

  await run(pages, true);
  await run(images, false);

  if (!failed) {
    for (const request of await cache.keys()) {
      if (!wanted.has(new URL(request.url).pathname)) await cache.delete(request);
    }
  }
  return !failed;
}

async function tell(ok) {
  for (const client of await self.clients.matchAll({ type: 'window', includeUncontrolled: true })) {
    client.postMessage({ type: 'offline-synced', ok });
  }
}

let running = null;

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'sync-offline') return;
  // A page asking while a run is under way waits for that run instead of starting another.
  running ??= syncOffline().then(
    (ok) => tell(ok),
    () => tell(false)
  ).finally(() => {
    running = null;
  });
  event.waitUntil(running);
});

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

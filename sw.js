---
layout: null
sitemap: false
---
{%- assign offline_posts = 10 %}
// Service worker. Four caches:
//  - VISITED (fixed name, survives updates): pages the reader opened, fetched network-first
//    (a stored copy is shown if the network takes over 1.5 s) and kept for offline reading, plus
//    other /assets/ files, served from the cache and refreshed in the background. Also receives the post (and its images) of every push
//    notification when it arrives. Trimmed to the most recent MAX_VISITED entries.
//  - OFFLINE (fixed name): the pages listed in sitemap.xml and the images they use, stored
//    when the page asks for it ({type: 'sync-offline'}; it does so only inside the installed
//    app). Of the posts only the newest {{ offline_posts }} are kept; everything else in the
//    sitemap (home, archives, authors, columns, about) is kept. Pages that dropped out are
//    removed.
//  - EXTERNAL (fixed name): the two ChessPublica files and the twelve chess piece images
//    that every board loads from other sites (see _includes/head.html and scripts.html).
//    Stored at install and served from here, so boards work offline on a new device too.
//  - SHELL (new name every build): the start page, the offline page and this build's CSS,
//    scripts, fonts and icons, stored at install so the installed app opens offline right
//    after an update. The previous SHELL is deleted when the new one activates.
// Everything else (analytics, other embeds) goes straight to the network.
// Push messages ({title, body, url}, sent by scripts/send-push.mjs) are shown as
// notifications; tapping one opens its page.

const VERSION = '{{ site.time | date: "%s" }}';
const VISITED = 'satranckahvesi-visited';
const OFFLINE = 'satranckahvesi-offline';
const SHELL = 'satranckahvesi-shell-' + VERSION;
const MAX_VISITED = 120;
const POSTS = '{{ "/posts/" | relative_url }}';
// site.posts is sorted newest first.
const LATEST_POSTS = [
  {%- for post in site.posts limit: offline_posts %}
  '{{ post.url | relative_url }}',
  {%- endfor %}
];
const OFFLINE_URL = '{{ "/offline/" | relative_url }}';
const ASSETS = '{{ "/assets/" | relative_url }}';
const ICON = '{{ "/assets/img/icon-192.png" | relative_url }}';
const SITEMAP = '{{ "/sitemap.xml" | relative_url }}';
// Files other sites serve to the boards. Keep in sync with _includes/head.html and
// scripts.html (ChessPublica) and with the pieceTheme inside ChessPublica.all.min.js.
const EXTERNAL = 'satranckahvesi-external';
const CHESSPUBLICA = 'https://chesspublica.github.io/dist/';
const PIECES = 'https://chessboardjs.com/img/chesspieces/wikipedia/';
const EXTERNAL_FILES = [
  CHESSPUBLICA + 'ChessPublica.all.min.css',
  CHESSPUBLICA + 'ChessPublica.all.min.js',
  ...['wK', 'wQ', 'wR', 'wB', 'wN', 'wP', 'bK', 'bQ', 'bR', 'bB', 'bN', 'bP'].map((piece) => PIECES + piece + '.png')
];
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
      .then(() => Promise.allSettled(EXTERNAL_FILES.map((url) => storeExternal(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => ![VISITED, OFFLINE, EXTERNAL, SHELL].includes(key)).map((key) => caches.delete(key))))
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

// A page already stored is shown after at most PATIENCE: a slow connection must not leave the
// reader tapping a frozen screen when the page is sitting in the cache. The fresh copy still
// replaces the stored one for next time.
const PATIENCE = 1500;

async function networkFirst(request) {
  const fresh = fetch(request).then((response) => store(request, response));
  const cached = await caches.match(request);
  if (!cached) {
    try {
      return await fresh;
    } catch {
      return caches.match(OFFLINE_URL);
    }
  }
  const timeout = new Promise((resolve) => setTimeout(() => resolve(cached), PATIENCE));
  return Promise.race([fresh.catch(() => cached), timeout]);
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
  const pages = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1].trim()).pathname))]
    .filter((path) => !path.startsWith(POSTS) || LATEST_POSTS.includes(path));
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

// ChessPublica answers with CORS headers, so its files are stored as readable responses.
// The piece images come without them and are stored as opaque responses, which an <img>
// can still use.
async function storeExternal(url) {
  const response = await fetch(url, { mode: url.startsWith(CHESSPUBLICA) ? 'cors' : 'no-cors' });
  if (!response.ok && response.type !== 'opaque') throw new Error(String(response.status));
  await (await caches.open(EXTERNAL)).put(url, response.clone());
  return response;
}

// The boards break when the ChessPublica files change under the site's own scripts, so
// those are refreshed in the background; the piece images never change.
async function external(request) {
  const cached = await (await caches.open(EXTERNAL)).match(request.url);
  if (cached) {
    if (request.url.startsWith(CHESSPUBLICA)) storeExternal(request.url).catch(() => {});
    return cached;
  }
  try {
    return await storeExternal(request.url);
  } catch {
    return fetch(request);
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    if (EXTERNAL_FILES.includes(request.url)) event.respondWith(external(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
  } else if (url.pathname.startsWith(ASSETS)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Stores the page a notification points to, and its images, so the post can be read
// offline without the app having been opened. Goes into VISITED, which is trimmed.
async function cachePostFromNotification(url) {
  const target = new URL(url || '/', self.location.origin);
  if (target.origin !== self.location.origin || !target.pathname.startsWith(POSTS)) return;
  const response = await fetch(target.pathname, { cache: 'no-cache' });
  if (!response.ok) return;
  await store(target.pathname, response);
  const images = [...new Set((await response.text()).match(IMAGES) ?? [])];
  await Promise.allSettled(images.map(async (image) => store(image, await fetch(image))));
}

self.addEventListener('push', (event) => {
  let message = {};
  try {
    message = event.data ? event.data.json() : {};
  } catch {
    message = {};
  }
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(message.title || 'Satranç Kahvesi', {
        body: message.body || '',
        icon: ICON,
        tag: message.url,
        data: { url: message.url }
      }),
      // A failed download must never get in the way of the notification.
      cachePostFromNotification(message.url).catch(() => {})
    ])
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

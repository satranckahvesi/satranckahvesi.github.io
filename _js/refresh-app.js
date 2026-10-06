// Refresh button in the header, shown only inside the installed app (see _includes/header.html).
// When a page looks broken (a board that stays empty, old styles), it drops the service
// worker and every cache it keeps, registers the worker again and waits until it has downloaded
// the site's files and the pages for offline reading, then reloads from the network. A full-screen
// notice covers the page meanwhile.
import { isStandalone } from './lib/platform.js';
import { readSession, removeSession, writeLocal, writeSession } from './lib/session.js';

const SYNC_KEY = 'satranckahvesi-offline-sync';
// Set just before the reload, so the next page keeps the notice up until it has finished rendering.
// Must match the inline script in _includes/head.html, which hides the page until then.
const REFRESHING_KEY = 'satranckahvesi-refreshing';
// A slow or broken download must not keep the reader behind the notice forever.
const GIVE_UP_AFTER = 2 * 60 * 1000;
const RENDER_GIVE_UP_AFTER = 30 * 1000;
// Length of one turn of the spinner (keep in step with _css/install.css).
const SPIN_MS = 1200;

async function reset() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
}

// Resolves once the worker reports that the offline download has finished, whether it worked or not.
function offlineSynced() {
  return new Promise((resolve) => {
    navigator.serviceWorker.addEventListener('message', function listen(event) {
      if (event.data?.type !== 'offline-synced') return;
      navigator.serviceWorker.removeEventListener('message', listen);
      if (event.data.ok) writeLocal(SYNC_KEY, String(Date.now()));
      resolve();
    });
  });
}

// Registering resolves `ready` only once the worker has installed, which is when it has
// stored the site's own files and the ChessPublica files that every board loads.
async function download() {
  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  const synced = offlineSynced();
  (registration.active ?? (await navigator.serviceWorker.ready).active)?.postMessage({ type: 'sync-offline' });
  await synced;
}

// The notice itself is markup in every page (_includes/loading-notice.html), shown by the
// `app-refreshing` class on <html>. `spinStart` (a Date.now() value) lets the notice on the next
// page carry on turning from where the previous one stopped instead of starting over.
const notice = () => document.querySelector('.refresh-overlay');

function showNotice(spinStart = Date.now()) {
  const spinner = notice()?.querySelector('.refresh-overlay-spinner');
  if (spinner) spinner.style.animationDelay = `${-((Date.now() - spinStart) % SPIN_MS)}ms`;
  document.documentElement.classList.add('app-refreshing');
}

function hideNotice() {
  document.documentElement.classList.remove('app-refreshing');
}

export function installRefreshButton() {
  const button = document.querySelector('.refresh-app');
  const supported = 'serviceWorker' in navigator && 'caches' in window;
  if (!button || !supported || !isStandalone()) return;
  button.hidden = false;

  let running = false;
  button.addEventListener('click', async () => {
    if (running) return;
    running = true;

    if (!navigator.onLine) {
      const overlay = notice();
      const message = overlay.querySelector('.refresh-overlay-message');
      const original = message.textContent;
      message.textContent = 'İnternet bağlantısı yok.';
      overlay.classList.add('is-offline');
      showNotice();
      setTimeout(() => {
        hideNotice();
        overlay.classList.remove('is-offline');
        message.textContent = original;
        running = false;
      }, 2000);
      return;
    }

    // The same notice, in the same setting, as on the page that follows the reload.
    const spinStart = Date.now();
    showNotice(spinStart);
    try {
      await reset();
      await Promise.race([download(), new Promise((resolve) => setTimeout(resolve, GIVE_UP_AFTER))]);
    } finally {
      writeSession(REFRESHING_KEY, String(spinStart));
      location.reload();
    }
  });
}

/**
 * Covers the page with the same notice until `ready` resolves (or RENDER_GIVE_UP_AFTER passes),
 * then lifts it. It is wanted on the page that follows a refresh, and on every article opened
 * inside the installed app, where the boards take a while to draw. Both are marked by the
 * `app-refreshing` class that head.html puts on <html> before first paint; any other load is
 * left alone.
 *
 * @param {Promise<void>} ready resolves when the page has finished drawing
 */
export async function holdLoadNotice(ready) {
  const flag = readSession(REFRESHING_KEY);
  removeSession(REFRESHING_KEY);
  if (!flag && !document.documentElement.classList.contains('app-refreshing')) return;

  showNotice(Number(flag) || Date.now());
  await Promise.race([ready.catch(() => {}), new Promise((resolve) => setTimeout(resolve, RENDER_GIVE_UP_AFTER))]);
  hideNotice();
}

/**
 * Inside the installed app, tapping a link to an article covers the page with the notice at once,
 * instead of leaving the old page frozen while the article is fetched and parsed. The article's
 * own page then keeps the notice up (head.html) until its boards have drawn.
 */
export function installLinkNotice() {
  if (!isStandalone()) return;

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    const url = new URL(link.href, location.href);
    const isArticle = url.pathname.startsWith('/posts/') && url.pathname.length > '/posts/'.length;
    if (url.origin !== location.origin || !isArticle || url.pathname === location.pathname) return;

    const spinStart = Date.now();
    writeSession(REFRESHING_KEY, String(spinStart));
    showNotice(spinStart);
    // The tap may not lead anywhere (navigation refused or failed): never keep the reader waiting on it.
    setTimeout(hideNotice, RENDER_GIVE_UP_AFTER);
  });

  // Coming back to a page kept in memory shows it as it was left, notice included.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) hideNotice();
  });
}

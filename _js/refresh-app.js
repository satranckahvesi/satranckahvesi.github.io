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

// `spinStart` (a Date.now() value) lets the notice on the next page carry on turning from where
// the previous one stopped instead of starting over.
function createOverlay(message, spinStart = Date.now()) {
  const overlay = document.createElement('div');
  overlay.className = 'refresh-overlay';
  overlay.setAttribute('role', 'status');

  // The cup mark is already on the page (footer); ids must stay unique, so the copy gets its own.
  const logo = document.querySelector('.footer-logo');
  if (logo) {
    const mark = document.createElement('div');
    mark.className = 'refresh-overlay-logo';
    mark.innerHTML = logo.outerHTML.replaceAll('footer-logo-halo', 'refresh-overlay-halo');
    overlay.append(mark);
  }

  const name = document.createElement('p');
  name.className = 'refresh-overlay-name';
  name.textContent = document.querySelector('.footer-brand-name')?.textContent ?? '';

  // The turning element is a plain <div>: an animated <svg> is repainted on the main thread and
  // stalls while the page is busy drawing boards, a <div> is turned by the compositor.
  const spinner = document.createElement('div');
  spinner.className = 'refresh-overlay-spinner';
  spinner.style.animationDelay = `${-((Date.now() - spinStart) % SPIN_MS)}ms`;
  spinner.append(document.querySelector('.refresh-app svg').cloneNode(true));

  const text = document.createElement('p');
  text.className = 'refresh-overlay-message';
  text.textContent = message;

  overlay.append(name, spinner, text);
  document.body.append(overlay);
  return overlay;
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
      const notice = createOverlay('İnternet bağlantısı yok.');
      notice.querySelector('.refresh-overlay-spinner').remove();
      setTimeout(() => {
        notice.remove();
        running = false;
      }, 2000);
      return;
    }

    // Same setting as the page that follows the reload (see head.html): page hidden, no scrolling,
    // so the notice sits in exactly the same place on both.
    document.documentElement.classList.add('app-refreshing');
    const spinStart = Date.now();
    createOverlay('Yazılar yükleniyor...', spinStart);
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

  const notice = createOverlay('Yazılar yükleniyor...', Number(flag) || Date.now());
  await Promise.race([ready.catch(() => {}), new Promise((resolve) => setTimeout(resolve, RENDER_GIVE_UP_AFTER))]);
  notice.remove();
  document.documentElement.classList.remove('app-refreshing');
}

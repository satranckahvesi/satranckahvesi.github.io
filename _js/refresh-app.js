// Refresh button in the header, shown only inside the installed app (see _includes/header.html).
// When a page looks broken (a board that stays empty, old styles), it drops the service
// worker and every cache it keeps, registers the worker again and waits until it has downloaded
// the site's files and the pages for offline reading, then reloads from the network. A full-screen
// notice covers the page meanwhile.
import { isStandalone } from './lib/platform.js';
import { writeLocal } from './lib/session.js';

const SYNC_KEY = 'satranckahvesi-offline-sync';
// A slow or broken download must not keep the reader behind the notice forever.
const GIVE_UP_AFTER = 2 * 60 * 1000;

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

function createOverlay(message) {
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

  const spinner = document.querySelector('.refresh-app svg').cloneNode(true);
  spinner.classList.add('refresh-overlay-spinner');

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

    createOverlay('Yazılar yükleniyor...');
    try {
      await reset();
      await Promise.race([download(), new Promise((resolve) => setTimeout(resolve, GIVE_UP_AFTER))]);
    } finally {
      location.reload();
    }
  });
}

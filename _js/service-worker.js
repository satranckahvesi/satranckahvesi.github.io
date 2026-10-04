// Registers /sw.js, which keeps visited pages available offline. When the site runs as an
// installed app, it also asks the worker to download every page for offline reading, at
// most once a day (the worker answers when it is done, so a failed run is retried).
import { readLocal, writeLocal } from './lib/session.js';
import { isStandalone } from './lib/platform.js';

const SYNC_KEY = 'satranckahvesi-offline-sync';
const SYNC_EVERY = 24 * 60 * 60 * 1000;

export function installServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });

  if (!isStandalone()) return;

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'offline-synced' && event.data.ok) writeLocal(SYNC_KEY, String(Date.now()));
  });

  navigator.serviceWorker.ready.then((registration) => {
    const last = Number(readLocal(SYNC_KEY)) || 0;
    if (Date.now() - last > SYNC_EVERY) registration.active?.postMessage({ type: 'sync-offline' });
  });
}

// "Uygulamayı yenile" button in the footer (see _includes/footer.html), shown only inside the
// installed app. When a page looks broken (a board that stays empty, old styles), it drops the
// service worker and every cache it keeps, then reloads from the network. The worker registers
// itself again on the next load and downloads the current files.
import { isStandalone } from './lib/platform.js';

const SYNC_KEY = 'satranckahvesi-offline-sync';

async function reset() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
  try {
    localStorage.removeItem(SYNC_KEY);
  } catch {
    // Blocked storage: the offline download is simply retried later.
  }
}

export function installRefreshButton() {
  const wrap = document.querySelector('.refresh-app-wrap');
  const button = wrap?.querySelector('.refresh-app');
  if (!wrap || !button || !isStandalone()) return;
  wrap.hidden = false;

  button.addEventListener('click', async () => {
    button.disabled = true;
    button.textContent = 'Yenileniyor…';
    try {
      await reset();
    } finally {
      location.reload();
    }
  });
}

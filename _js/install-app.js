// "Uygulamayı yükle" button in the footer (see _includes/footer.html).
// Android Chrome (and other Chromium browsers) fire beforeinstallprompt, which the
// button replays. It is shown on Android only, and not inside the installed app.
import { isAndroid, isStandalone } from './lib/platform.js';

export function installAppButton() {
  const wrap = document.querySelector('.install-app-wrap');
  const button = wrap?.querySelector('.install-app');
  if (!wrap || !button || !isAndroid() || isStandalone()) return;

  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    wrap.hidden = false;
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    wrap.hidden = true;
  });

  button.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    const prompt = deferredPrompt;
    deferredPrompt = null;
    wrap.hidden = true;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'dismissed') {
      deferredPrompt = prompt;
      wrap.hidden = false;
    }
  });
}

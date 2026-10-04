// "Uygulamayı yükle" button in the footer (see _includes/footer.html).
// Chromium browsers (Chrome, Edge, Samsung Internet) fire beforeinstallprompt, which
// the button replays. iOS has no install API, so the button shows the manual steps.
// Nothing is shown on computers, inside the installed app or in browsers that cannot install.
const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const isMobile = () => isIos() || /android/i.test(navigator.userAgent) || navigator.userAgentData?.mobile === true;

export function installAppButton() {
  const wrap = document.querySelector('.install-app-wrap');
  const button = wrap?.querySelector('.install-app');
  const help = document.querySelector('.install-help');
  if (!wrap || !button || !isMobile() || isStandalone()) return;

  let deferredPrompt = null;
  const show = () => {
    wrap.hidden = false;
  };

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    show();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    wrap.hidden = true;
  });

  if (isIos()) show();

  button.addEventListener('click', async () => {
    if (deferredPrompt) {
      const prompt = deferredPrompt;
      deferredPrompt = null;
      wrap.hidden = true;
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'dismissed') show();
    } else if (help) {
      help.hidden = false;
    }
  });

  help?.querySelector('button')?.addEventListener('click', () => {
    help.hidden = true;
  });
}

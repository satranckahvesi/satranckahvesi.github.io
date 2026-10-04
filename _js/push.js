// "Bildirim tercihleri" button in the footer (see _includes/footer.html). Like the cookie
// button it opens a banner (.push-banner) where the reader chooses; the banner never opens
// by itself, and the browser's permission prompt only follows a click on its main button.
// Subscribes this browser to Web Push and sends the subscription to the Apps Script
// endpoint (scripts/push/apps-script.gs), which keeps it in a Google Sheet. iOS only offers
// push to a site that was added to the Home Screen and is opened from there, so in a Safari
// tab the banner explains that instead of offering the choice.
import { isIos, isStandalone } from './lib/platform.js';

// The VAPID public key arrives as base64url; pushManager.subscribe wants bytes.
export function urlBase64ToBytes(value) {
  const padded = value + '='.repeat((4 - (value.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

// text/plain keeps this a "simple" request: Apps Script cannot answer a CORS preflight.
async function send(endpoint, payload) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!result.ok) throw new Error(result.error || 'request_failed');
}

export function installPushButton() {
  const toggle = document.querySelector('.push-toggle');
  const wrap = toggle?.closest('.push-wrap');
  const banner = document.querySelector('.push-banner');
  const { endpoint, key } = toggle?.dataset ?? {};
  if (!toggle || !wrap || !banner || !endpoint || !key) return;

  const iosTab = isIos() && !isStandalone();
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (!iosTab && !supported) return;
  wrap.hidden = false;

  const dismiss = banner.querySelector('[data-push="dismiss"]');
  const primary = banner.querySelector('[data-push="primary"]');
  const registration = iosTab ? null : navigator.serviceWorker.ready;
  let run = null;

  // Shows one of the messages in the banner, with an optional main button.
  function show(state, { label, action, dismissLabel = 'Kapat' } = {}) {
    for (const message of banner.querySelectorAll('[data-state]')) message.hidden = message.dataset.state !== state;
    primary.hidden = !label;
    if (label) primary.textContent = label;
    primary.disabled = false;
    dismiss.textContent = dismissLabel;
    run = action ?? null;
  }

  const showOff = () => show('off', { label: 'Bildirimleri aç', action: turnOn, dismissLabel: 'Şimdi değil' });

  async function describe() {
    if (iosTab) return show('ios');
    const reg = await registration;
    if (await reg.pushManager.getSubscription()) return show('on', { label: 'Bildirimleri kapat', action: turnOff });
    if (Notification.permission === 'denied') return show('blocked');
    return showOff();
  }

  async function turnOn() {
    const reg = await registration;
    const permission = await Notification.requestPermission();
    if (permission === 'denied') return show('blocked');
    if (permission !== 'granted') {
      show('closed', { label: 'Bildirimleri aç', action: turnOn, dismissLabel: 'Şimdi değil' });
      return;
    }
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToBytes(key)
    });
    try {
      await send(endpoint, { action: 'subscribe', subscription: subscription.toJSON() });
    } catch (error) {
      await subscription.unsubscribe();
      throw error;
    }
    show('enabled');
  }

  async function turnOff() {
    const reg = await registration;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      send(endpoint, { action: 'unsubscribe', endpoint: subscription.endpoint }).catch(() => {});
    }
    show('disabled');
  }

  function open() {
    // Sit above the cookie banner instead of covering its buttons.
    const cookie = document.querySelector('.cookie-banner');
    banner.style.bottom = cookie && !cookie.hidden ? `${cookie.offsetHeight + 32}px` : '';
    banner.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    (primary.hidden ? dismiss : primary).focus();
  }

  function close(refocus = false) {
    banner.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    if (refocus) toggle.focus();
  }

  toggle.addEventListener('click', async () => {
    if (!banner.hidden) return close();
    try {
      await describe();
    } catch {
      show('error');
    }
    open();
  });

  dismiss.addEventListener('click', () => close(true));

  primary.addEventListener('click', async () => {
    if (!run) return;
    primary.disabled = true;
    try {
      await run();
    } catch {
      show('error');
    }
    (primary.hidden ? dismiss : primary).focus();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !banner.hidden) close(true);
  });
}

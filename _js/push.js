// "Bildirimleri aç / kapat" button in the footer (see _includes/footer.html).
// Subscribes this browser to Web Push and sends the subscription to the Apps Script
// endpoint (scripts/push/apps-script.gs), which keeps it in a Google Sheet. The
// permission prompt opens only from a click. Computers and Android only: iOS needs the
// site on the Home Screen and is left out on purpose.
import { isIos } from './lib/platform.js';

const LABEL_ON = 'Bildirimleri aç';
const LABEL_OFF = 'Bildirimleri kapat';

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
  const wrap = document.querySelector('.push-wrap');
  const button = wrap?.querySelector('.push-toggle');
  const status = document.querySelector('.push-status');
  const { endpoint, key } = button?.dataset ?? {};
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (!button || !endpoint || !key || !supported || isIos()) return;

  const say = (message) => {
    status.textContent = message;
  };
  const render = (subscribed) => {
    button.textContent = subscribed ? LABEL_OFF : LABEL_ON;
    button.dataset.subscribed = String(subscribed);
  };

  const registration = navigator.serviceWorker.ready;

  registration.then(async (reg) => {
    const existing = await reg.pushManager.getSubscription();
    if (!existing && Notification.permission === 'denied') return;
    render(Boolean(existing));
    wrap.hidden = false;
  });

  async function subscribe(reg) {
    if ((await Notification.requestPermission()) !== 'granted') {
      say('Bildirim izni verilmedi. İsterseniz tarayıcı ayarlarından izin verebilirsiniz.');
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
    render(true);
    say('Bildirimler açıldı. Yeni bir yazı yayımlandığında haber vereceğiz.');
  }

  async function unsubscribe(subscription) {
    await subscription.unsubscribe();
    render(false);
    say('Bildirimler kapatıldı.');
    send(endpoint, { action: 'unsubscribe', endpoint: subscription.endpoint }).catch(() => {});
  }

  button.addEventListener('click', async () => {
    button.disabled = true;
    say('');
    try {
      const reg = await registration;
      const existing = await reg.pushManager.getSubscription();
      await (existing ? unsubscribe(existing) : subscribe(reg));
    } catch {
      say('Bir sorun oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      button.disabled = false;
    }
  });
}

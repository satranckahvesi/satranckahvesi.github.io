// Google Analytics 4. Ölçüm kimliği site.config.json'daki `ga4_measurement_id` alanından gelir;
// boşsa hiçbir şey yüklenmez. SPA olduğu için page_view otomatik değil, rota değişiminde elle gönderilir.
import siteConfig from '../../site.config.json';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const MEASUREMENT_ID = (siteConfig.ga4_measurement_id || '').trim();
let ready = false;

export function initAnalytics() {
  if (ready || !MEASUREMENT_ID || typeof document === 'undefined') return;
  ready = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID, { send_page_view: false });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
  document.head.appendChild(script);
}

export function trackPageView(path: string) {
  if (!ready || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

import { readLocal, writeLocal } from './lib/session.js';

// Analytics runs only after the reader accepts. The banner and the footer
// button come from _includes/cookie-banner.html (rendered only when
// google_analytics is set in _config.yml and the site is built for production).
const STORAGE_KEY = 'satranckahvesi-cookie-consent';

export const readChoice = () => {
  const value = readLocal(STORAGE_KEY);
  return value === 'granted' || value === 'denied' ? value : null;
};

// GA4 sets "_ga" and "_ga_<container id>".
export const isGaCookie = (name) => name === '_ga' || name.startsWith('_ga_');

function loadAnalytics(id) {
  if (window.satranckahvesiAnalyticsLoaded) return;
  window.satranckahvesiAnalyticsLoaded = true;
  window[`ga-disable-${id}`] = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', id);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.append(script);
}

function stopAnalytics(id) {
  window[`ga-disable-${id}`] = true;
  const host = location.hostname;
  const parent = host.split('.').slice(-2).join('.');
  for (const part of document.cookie.split(';')) {
    const name = part.split('=')[0].trim();
    if (!isGaCookie(name)) continue;
    for (const domain of [null, host, `.${host}`, `.${parent}`]) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain ? `; domain=${domain}` : ''}`;
    }
  }
}

export function installCookieConsent() {
  const banner = document.querySelector('.cookie-banner');
  const id = banner?.dataset.gaId;
  if (!banner || !id) return;

  const show = () => { banner.hidden = false; };
  const choose = (choice) => {
    writeLocal(STORAGE_KEY, choice);
    banner.hidden = true;
    if (choice === 'granted') loadAnalytics(id);
    else stopAnalytics(id);
  };

  banner.querySelector('[data-consent="granted"]')?.addEventListener('click', () => choose('granted'));
  banner.querySelector('[data-consent="denied"]')?.addEventListener('click', () => choose('denied'));
  document.querySelector('.cookie-settings')?.addEventListener('click', show);

  const saved = readChoice();
  if (saved === 'granted') loadAnalytics(id);
  else if (saved === null) show();
}

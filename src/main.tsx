import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { loadRuntimeConfig } from './lib/config.ts';

// Load runtime configuration before rendering the app
async function initializeApp() {
  // Prerendered blog pages are served as pure static HTML for SEO.
  // Intentionally skip React mounting so the crawler-facing markup stays
  // lightweight and self-contained — no client-side hydration needed.
  if (
    document
      .querySelector('meta[name="prerender-static-page"]')
      ?.getAttribute('content') === 'blog'
  ) {
    return;
  }

  try {
    await loadRuntimeConfig();
    console.log('Runtime configuration loaded successfully');
  } catch (error) {
    console.warn(
      'Failed to load runtime configuration, using defaults:',
      error
    );
  }

  // Render the app
  createRoot(document.getElementById('root')!).render(<App />);
}

// Ana sayfa yenilenince tarayıcı kaldığı kaydırma konumuna döner; ana sayfada istenmez, sayfa başında açılır.
// Yazı sayfalarında bu geri yükleme olduğu gibi kalır. Yenilemeyle gelen ana sayfa girişi 'manual' olur;
// sonraki sayfa geçişleri etkilenmesin diye Index sayfadan ayrılırken 'auto'ya döndürür.
const navType = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type;
if (navType === 'reload' && window.location.pathname.replace(/\/+$/, '') === import.meta.env.BASE_URL.replace(/\/+$/, '') && !window.location.hash) {
  window.history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
}

// Initialize the app
initializeApp();

import { readLocal, writeLocal } from './lib/session.js';

// Must match the inline script in _includes/head.html, which applies the saved
// theme (or the OS setting) before first paint.
const STORAGE_KEY = 'satranckahvesi-theme';

export function installThemeToggle() {
  const button = document.querySelector('.theme-toggle');
  if (!button) return;

  const root = document.documentElement;
  const osDark = window.matchMedia?.('(prefers-color-scheme: dark)');

  const isDark = () => root.getAttribute('data-theme') === 'dark';
  const apply = (theme) => {
    root.setAttribute('data-theme', theme);
    button.setAttribute('aria-label', theme === 'dark' ? 'Aydınlık temaya geç' : 'Karanlık temaya geç');
  };

  apply(root.getAttribute('data-theme') ?? (osDark?.matches ? 'dark' : 'light'));

  button.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    writeLocal(STORAGE_KEY, next);
    apply(next);
  });

  // Follow the OS setting live, unless the reader has chosen explicitly.
  osDark?.addEventListener?.('change', (event) => {
    if (!readLocal(STORAGE_KEY)) apply(event.matches ? 'dark' : 'light');
  });
}

import { stepStudy } from './keyboard.js';

const chevron = (points) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="${points}"/></svg>`;

const NAV_BUTTONS = [
  { dir: 'prev', label: 'Bir hamle geri', icon: chevron('15 6 9 12 15 18') },
  { dir: 'next', label: 'Bir hamle ileri', icon: chevron('9 6 15 12 9 18') }
];

// ChessPublica exposes no stable hook for individual ribbon buttons, so they
// are matched by accessible name. Removed: the mobile article toggle (the
// board stays visible and the active comment is mirrored below it), the table
// of contents, collapse/expand, and Play with its speed control (no autoplay).
const REMOVED_LABEL = /table.*of.*contents|\btoc\b|collapse|expand|^play\b|speed/i;

const labelOf = (btn) => (btn.getAttribute('aria-label') || btn.getAttribute('title') || btn.textContent || '').trim();

export function pruneRibbon(study) {
  for (const btn of study.querySelectorAll('.pgn-study-ribbon-btn')) {
    const label = labelOf(btn);
    if (btn.classList.contains('pgn-study-article-btn') || REMOVED_LABEL.test(label)) {
      btn.remove();
    } else if (/setting/i.test(label)) {
      btn.setAttribute('aria-label', 'Ayarlar');
      btn.title = 'Ayarlar';
    }
  }
}

// Previous/next buttons, where Play used to be. The remaining buttons
// (Download, Flip) live in a settings panel that stays hidden until opened.
export function addNavButtons(study) {
  const ribbon = study.querySelector('.pgn-study-ribbon');
  if (!ribbon || study.querySelector('[data-pgn-nav]')) return;

  const group = study.querySelector('.pgn-study-ribbon-left') || ribbon;
  for (const { dir, label, icon } of NAV_BUTTONS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pgn-study-ribbon-btn';
    btn.dataset.pgnNav = dir;
    btn.setAttribute('aria-label', label);
    btn.title = label;
    btn.innerHTML = icon;
    btn.addEventListener('click', () => stepStudy(study, dir));
    group.append(btn);
  }
}

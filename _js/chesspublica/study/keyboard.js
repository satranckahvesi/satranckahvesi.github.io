import { resolveBranch } from './branch.js';

const ARROW_DIRECTION = { ArrowRight: 'next', ArrowLeft: 'prev' };

// ChessPublica's keyboard shortcuts silently do nothing unless the player is
// at least partly in the viewport.
export function ensureContainerInView(study) {
  study?.querySelector('.player-container')?.scrollIntoView({ block: 'nearest' });
}

// ChessPublica sends keys to one page-wide "active engine", claimed by
// whichever player was built first (often an earlier puzzle) and changed only
// by a mouseenter on `.player-wrapper`. Dispatching that event reclaims it.
export function activateEngineFor(study) {
  study?.querySelector('.player-wrapper')?.dispatchEvent(new MouseEvent('mouseenter'));
}

const isTypingTarget = (el) =>
  el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable);

/**
 * Page-wide keyboard handling for studies. Returns `setActive(study)`: which
 * study an arrow key acts on (the last one hovered, clicked or touched).
 */
export function installKeyboard(studies) {
  let active = studies[0];
  for (const study of studies) {
    const mark = () => {
      active = study;
    };
    study.addEventListener('mouseenter', mark);
    study.addEventListener('click', mark);
    study.addEventListener('touchstart', mark, { passive: true });
  }

  document.addEventListener('keydown', (e) => {
    if (!e.isTrusted || isTypingTarget(document.activeElement)) return;

    // Space toggles ChessPublica's autoplay, which this site removed. Stopping
    // the event here (before its own listener) leaves page scrolling intact.
    if (e.code === 'Space') {
      e.stopImmediatePropagation();
      return;
    }

    const dir = ARROW_DIRECTION[e.code];
    if (!dir) return;
    ensureContainerInView(active);
    activateEngineFor(active);
    // At a branch point ChessPublica's own handler would not advance; resolving
    // it already is the step, so its handler must not also run (it would
    // advance a second ply on the same keypress).
    if (dir === 'next' && resolveBranch(active)) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  });

  // Two ChessPublica board-click listeners (toggle play, and "double click
  // jumps 10 plies") do nothing a reader should reach here. Capture phase on
  // document runs before either, regardless of script order.
  document.addEventListener(
    'click',
    (e) => {
      if (e.target.closest?.('.post-body pgn-study .board-wrap')) e.stopImmediatePropagation();
    },
    true
  );

  return (study) => {
    active = study;
  };
}

/** Steps a study with the same synthetic key ChessPublica's own shortcut uses (it clamps at both ends). */
export function stepStudy(study, dir) {
  if (dir === 'next' && resolveBranch(study)) return;
  ensureContainerInView(study);
  activateEngineFor(study);
  study.dispatchEvent(new MouseEvent('mouseenter')); // makes this the active study above
  document.dispatchEvent(
    new KeyboardEvent('keydown', { code: dir === 'next' ? 'ArrowRight' : 'ArrowLeft', bubbles: true })
  );
}

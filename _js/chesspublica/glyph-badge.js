// ChessPublica draws a move-quality badge (".gm-badge": "!?", "??", ...) over
// the board, but clicking a move nested inside a variation never refreshes it
// (stale badge, badge on the wrong square, or no badge at all). The correct
// state is derived here from the active move, whose text carries its own
// trailing NAG symbol; mainline moves are left to ChessPublica.

const NAG_COLORS = {
  '!!': '#1aa34a',
  '!': '#00AA00',
  '!?': '#0000FF',
  '?!': '#FFAA00',
  '?': '#FF0000',
  '??': '#9c0202'
};
// Longest first, so "??" is not read as "?".
const NAG_LABELS = ['??', '!!', '!?', '?!', '!', '?'];

const BADGE_Z_INDEX = '30';
// Offset from the square's top-right corner, as a share of the square size.
const BADGE_OFFSET_RATIO = 0.05;

const trailingNag = (text) => NAG_LABELS.find((label) => text.endsWith(label)) ?? null;

function createBadge(label, boardEl) {
  const badge = document.createElement('div');
  badge.className = 'gm-badge';
  badge.textContent = label;
  badge.style.background = NAG_COLORS[label];
  badge.style.position = 'absolute';
  badge.style.zIndex = BADGE_Z_INDEX;
  boardEl.append(badge);
  return badge;
}

function fixBadge(study) {
  const active = study.querySelector('.pgn-move.pgn-move-active');
  const label = trailingNag(active ? active.textContent : '');
  let badge = study.querySelector('.gm-badge');

  if (!label) {
    badge?.remove();
    return;
  }

  // Only variation moves carry data-to; there is no square to place a
  // mainline badge on without it.
  const targetSquare = active.dataset.to;
  const boardEl = study.querySelector('.board');
  const squareEl = targetSquare && boardEl?.querySelector(`[data-square="${targetSquare}"]`);
  if (!squareEl) return;

  if (!badge || badge.textContent !== label) {
    badge?.remove();
    badge = createBadge(label, boardEl);
  }

  const board = boardEl.getBoundingClientRect();
  const square = squareEl.getBoundingClientRect();
  // Always written: a fresh badge starts with empty style values.
  badge.style.right = `${board.right - square.right + square.width * BADGE_OFFSET_RATIO}px`;
  badge.style.top = `${square.top - board.top - square.height * BADGE_OFFSET_RATIO}px`;
}

export function installGlyphBadge(body, watcher) {
  body.querySelectorAll('pgn-study').forEach((study) => {
    fixBadge(study);
    watcher.subscribe(() => fixBadge(study), { scope: study, types: ['childList', 'attributes'] });
  });
}

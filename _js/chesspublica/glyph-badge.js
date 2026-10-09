// ChessPublica draws a move-quality badge (".gm-badge": "!?", "??", ...) over
// the board, but clicking a move nested inside a variation never refreshes it
// (stale badge, badge on the wrong square, or no badge at all). The correct
// state is derived here from the active move, whose text carries its own
// NAG symbols. A move annotated with both a quality mark and an evaluation
// ("Nf5!±") gets no badge from ChessPublica at all, since it looks the
// combined string up as one glyph; the badge is drawn here for that case too,
// and the evaluation is set off from the mark ("Nf5! ±").

const NAG_COLORS = {
  '!!': '#1aa34a',
  '!': '#00AA00',
  '!?': '#0000FF',
  '?!': '#FFAA00',
  '?': '#FF0000',
  '??': '#9c0202'
};
// Longest first, so "??" is not read as "?". The quality mark may be followed
// by an evaluation symbol ("±", "=", "+−", ...), which is not part of the label.
const NAG_RE = /(\?\?|!!|!\?|\?!|!|\?)\s*[^\s!?]*$/;
const GLUED_EVAL_RE = /([!?])([^\s!?])/;

const BADGE_Z_INDEX = '30';
// Offset from the square's top-right corner, as a share of the square size.
const BADGE_OFFSET_RATIO = 0.05;

const trailingNag = (text) => NAG_RE.exec(text)?.[1] ?? null;

// Plain SAN only; castling has no destination square in its text.
const squareOfSan = (text) => /([a-h][1-8])(?!.*[a-h][1-8])/.exec(text)?.[1] ?? null;

// Text nodes are edited in place: replacing textContent would queue mutation
// records for the very observer that calls this.
function spaceEvaluations(study) {
  for (const move of study.querySelectorAll('.pgn-move, .var-move')) {
    const walker = document.createTreeWalker(move, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (GLUED_EVAL_RE.test(node.nodeValue)) node.nodeValue = node.nodeValue.replace(GLUED_EVAL_RE, '$1 $2');
    }
  }
}

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
  spaceEvaluations(study);
  const active = study.querySelector('.pgn-move.pgn-move-active');
  const label = trailingNag(active ? active.textContent : '');
  let badge = study.querySelector('.gm-badge');

  if (!label) {
    badge?.remove();
    return;
  }

  // Only variation moves carry data-to; mainline ones are read off their SAN.
  const targetSquare = active.dataset.to ?? squareOfSan(active.textContent);
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

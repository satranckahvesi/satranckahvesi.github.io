// ChessPublica hardcodes a handful of English UI strings with no option to
// change them; this translates them as they appear.

const LOADING = new Map([['Loading game…', 'Oyun yükleniyor…']]);

const SOLUTION_BUTTON = new Map([['Show solution move', 'Çözümü göster']]);

const HINT_RE = /^Find the best move for (White|Black)\.$/;
const HINT = {
  White: 'Beyaz için en iyi hamleyi bulun.',
  Black: 'Siyah için en iyi hamleyi bulun.'
};

const SOLVED = '\u{1F3C6} Puzzle solved!';
const SOLVED_NO_COMMENT = '\u{1F3C6} Tebrikler, bulmacayı çözdünüz!';

function localizeLoading(el) {
  const p = el.querySelector('.pgn-study-loading-side p');
  if (p && LOADING.has(p.textContent)) p.textContent = LOADING.get(p.textContent);
}

function localizeHint(el) {
  const match = HINT_RE.exec(el.textContent);
  if (match) el.textContent = HINT[match[1]];
}

function localizeSolutionButton(button) {
  if (SOLUTION_BUTTON.has(button.title)) button.title = SOLUTION_BUTTON.get(button.title);
  const label = button.getAttribute('aria-label');
  if (SOLUTION_BUTTON.has(label)) button.setAttribute('aria-label', SOLUTION_BUTTON.get(label));
}

// ChessPublica appends its English "Puzzle solved!" after a <br> when the
// caption already holds the winning move's own comment. In that case the
// generic line is dropped; otherwise it is replaced by a Turkish one.
function localizeSolved(node) {
  if (node.nodeType !== Node.ELEMENT_NODE || node.tagName !== 'SPAN' || node.textContent !== SOLVED) return;
  const prev = node.previousSibling;
  if (prev && prev.nodeType === Node.ELEMENT_NODE && prev.tagName === 'BR') {
    prev.remove();
    node.remove();
  } else {
    node.textContent = SOLVED_NO_COMMENT;
  }
}

export function installLocalization(watcher) {
  watcher.onAppear('.pgn-study-loading', localizeLoading);
  watcher.onAppear('.puzzle-hint-text', localizeHint);
  watcher.onAppear('.puzzle-hint-btn', localizeSolutionButton);

  // The hint prompt is rewritten in place on every position change
  // (`textContent = ...`), so appearance alone is not enough.
  watcher.subscribe(
    (records) => {
      for (const record of records) {
        const el = record.target.nodeType === Node.TEXT_NODE ? record.target.parentNode : record.target;
        if (el?.classList?.contains('puzzle-hint-text')) localizeHint(el);
      }
    },
    { types: ['childList', 'characterData'] }
  );

  watcher.subscribe(
    (records) => {
      for (const record of records) {
        if (record.target.matches?.('.cp-puzzle-caption-text')) record.addedNodes.forEach(localizeSolved);
      }
    },
    { types: ['childList'] }
  );
}

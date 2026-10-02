// ChessPublica starts a new paragraph after every inline diagram, prefixed
// with "N...&nbsp;" when it begins on Black's move. site.css hides those
// diagrams inside <pgn-study>, so the break would show "5. exd5" and then
// "5... Qxd5" on its own line. A paragraph that follows only hidden diagrams
// after a paragraph of the same kind is folded back into it. A comment or
// variation in between means the break is real and is left alone.

const MAINLINE = 'pgn-mainline';
const VARIATION = 'pgn-variation-line';

const isDiagram = (el) => el.classList.contains('cp-board-wrapper') || el.classList.contains('comment-diagram');
const isLine = (el) => el.tagName === 'P' && (el.classList.contains(MAINLINE) || el.classList.contains(VARIATION));

function join(study) {
  for (const line of study.querySelectorAll(`p.${MAINLINE}, p.${VARIATION}`)) {
    let prev = line.previousElementSibling;
    let skipped = 0;
    while (prev && isDiagram(prev)) {
      prev = prev.previousElementSibling;
      skipped++;
    }
    if (!skipped || !prev || !isLine(prev) || prev.className !== line.className) continue;

    const first = line.firstChild;
    if (first?.nodeType === Node.TEXT_NODE) first.nodeValue = first.nodeValue.replace(/^\s*\d+\.\.\.\s*/, '');
    prev.append(document.createTextNode(' '));
    // Moved, not copied, so ChessPublica's click and highlight handlers survive.
    while (line.firstChild) prev.append(line.firstChild);
    line.remove();
  }
}

export function installDiagramJoin(body, watcher) {
  body.querySelectorAll('pgn-study').forEach((study) => {
    let pending = false;
    join(study);
    // The move list is built after render and may be rebuilt; join() is
    // idempotent and runs at most once per frame.
    watcher.subscribe(
      () => {
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
          pending = false;
          join(study);
        });
      },
      { scope: study }
    );
  });
}

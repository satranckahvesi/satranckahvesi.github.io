// The full move list (with comments between the moves) is hidden on narrow
// screens. This mirrors the active comment into a box under the board, next
// to the navigation buttons, as the reader steps through the game.

import { studyEngine, variationOf } from '../engine.js';

const ACTIVE_COMMENT = '.pgn-comment.pgn-comment-active, .pgn-comment-inline.pgn-comment-active';

/** Mirrors the active comment of one study; returns { ensure, sync, keepLast }. */
export function createCommentMirror(study) {
  let lastSource = null;
  const display = () => study.querySelector('.pgn-study-mobile-comment');

  // Appended after every existing child: pgn-study is a three-column grid
  // filled by auto-placement, and a sibling wedged in between throws it off.
  function ensure() {
    if (display() || !study.querySelector('pgn-player')) return;
    const el = document.createElement('div');
    el.className = 'pgn-study-mobile-comment';
    study.append(el);
    sync();
  }

  // The variation picker can be inserted anywhere in the study; keeping the
  // mirror last pushes it above the picker however that happens.
  function keepLast() {
    const el = display();
    if (el && study.lastElementChild !== el) study.append(el);
  }

  function sync() {
    const el = display();
    if (!el) return;
    const active = study.querySelector(ACTIVE_COMMENT);

    // Only a variation's first move has a comment of its own. Inside a
    // variation, keep showing the last mirrored text instead of blanking it.
    if (!active && variationOf(studyEngine(study))) return;
    // The same element does not change its content while active; only which
    // element is active changes.
    if (active === lastSource) return;
    lastSource = active || null;

    el.replaceChildren(...(active ? [...active.childNodes].map((child) => child.cloneNode(true)) : []));
    el.classList.toggle('has-content', !!active);
  }

  return { ensure, sync, keepLast };
}

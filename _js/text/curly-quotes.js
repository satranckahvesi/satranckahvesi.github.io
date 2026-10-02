// kramdown's own smart quotes are switched off in _config.yml because they
// corrupt PGN text embedded in posts. Curly quotes are applied here instead,
// to the rendered DOM, skipping the elements that hold literal PGN/FEN text.

import { toCurly } from './curly.js';

const SKIPPED_TAGS = new Set(['PGN', 'FEN', 'PUZZLE', 'PGN-PLAYER', 'PGN-STUDY', 'CODE', 'PRE', 'SCRIPT', 'STYLE']);

// What ChessPublica renders author prose into. A side-line in the plain text
// view has no comment element of its own: the whole `.pgn-variation-line`
// paragraph is the closest thing (move notation never contains a quote).
const COMMENT_SELECTOR =
  '.pgn-comment, .pgn-comment-inline, .video-comment, .variation-comment, .comment-text-block, .pgn-variation-line';

// Stops at `root` so a pass over a comment does not climb into the very
// <pgn-study> it lives in and skip itself.
function insideSkippedElement(node, root) {
  for (let el = node.parentElement; el && el !== root; el = el.parentElement) {
    if (SKIPPED_TAGS.has(el.tagName)) return true;
  }
  return false;
}

/** Curly-quotes every eligible text node under `root`. */
export function curlyPass(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const targets = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue;
    if (!text.includes('"') && !text.includes("'") && !text.includes('--')) continue;
    if (!insideSkippedElement(node, root)) targets.push(node);
  }
  for (const node of targets) {
    // A quote opening a text node is not necessarily at the start of a word
    // (**Jan Timman**'ın): hand over the preceding sibling's last character as
    // context, then strip it back off.
    const prevChar = node.previousSibling ? node.previousSibling.textContent.slice(-1) : '';
    const converted = prevChar ? toCurly(prevChar + node.nodeValue).slice(prevChar.length) : toCurly(node.nodeValue);
    // Skip the write when nothing changed: a same-value assignment still
    // queues a mutation record and would re-trigger the watcher.
    if (node.nodeValue !== converted) node.nodeValue = converted;
  }
}

const closestComment = (node) =>
  (node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement)?.closest(COMMENT_SELECTOR) ?? null;

/**
 * Keeps comments ChessPublica renders later (and rewrites in place while the
 * reader steps through a game) curly-quoted. Needs the real PGN elements to
 * exist already, so raw PGN text is never mistaken for prose.
 */
export function keepCommentsCurly(body, watcher) {
  if (!body.querySelector('pgn, pgn-player, pgn-study')) return;

  watcher.subscribe(
    (records) => {
      for (const record of records) {
        if (record.type === 'characterData') {
          const owner = closestComment(record.target);
          if (owner) curlyPass(owner);
          continue;
        }
        for (const added of record.addedNodes) {
          if (added.nodeType === Node.TEXT_NODE) {
            const owner = closestComment(added);
            if (owner) curlyPass(owner);
          } else if (added.nodeType === Node.ELEMENT_NODE) {
            if (added.matches(COMMENT_SELECTOR)) curlyPass(added);
            added.querySelectorAll(COMMENT_SELECTOR).forEach(curlyPass);
          }
        }
      }
    },
    { types: ['childList', 'characterData'] }
  );
}

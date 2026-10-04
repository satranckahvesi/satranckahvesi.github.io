// A list written as consecutive PGN comments ({ 1- A } { 2- B } { 3- C }) is
// flattened by ChessPublica into one text node. The items are put back on
// their own lines with a <br> before each one. The text nodes are split, not
// rewritten, so the move elements around them (and their handlers) stay put.

import { splitListItems } from '../text/comment-list.js';

const SELECTOR = '.pgn-comment, .pgn-variation-line';

function breakList(textNode) {
  const pieces = splitListItems(textNode.nodeValue);
  if (pieces.length < 2) return;
  const fragment = document.createDocumentFragment();
  pieces.forEach((piece, i) => {
    if (i) fragment.append(document.createElement('br'));
    fragment.append(document.createTextNode(piece));
  });
  textNode.replaceWith(fragment);
}

function apply(root) {
  for (const el of root.querySelectorAll(SELECTOR)) {
    for (const node of [...el.childNodes]) {
      if (node.nodeType === Node.TEXT_NODE) breakList(node);
    }
  }
}

export function installCommentList(body, watcher) {
  let pending = false;
  apply(body);
  // The move list is built after render and may be rebuilt; apply() is
  // idempotent (a split node holds at most one list item) and runs at most
  // once per frame.
  watcher.subscribe(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      apply(body);
    });
  });
}

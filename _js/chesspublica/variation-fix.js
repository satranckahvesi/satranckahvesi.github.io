// In <pgn-player>, stepping inside a variation makes ChessPublica rebuild the
// comment box without the variation lists the reader just clicked into. This
// puts the live list nodes back (they keep their handlers and keep reflecting
// ChessPublica's updates), keeps one play button available, and makes
// switching between variations leave the previous one cleanly.

import { toArray } from '../lib/dom.js';
import { engineOf, variationOf } from './engine.js';

// Top-level variation blocks last seen on the mainline, per player.
const savedBlocks = new WeakMap();

const isBlock = (el) => el.classList?.contains('variation-block');

function ensurePlayButton(box) {
  let button = box.querySelector(':scope > .comment-play-btn');
  if (!button) {
    button = document.createElement('button');
    button.className = 'comment-play-btn';
    button.append(Object.assign(document.createElement('span'), { className: 'lucide-icon' }));
    box.append(button);
  }
  // Always a plain play glyph, borrowed from the hidden per-variation icon:
  // ChessPublica's replay glyph at a variation's end is not what pressing it
  // does here.
  const icon = button.querySelector('.lucide-icon');
  const source = box.querySelector('.variation-icon');
  if (icon && source) icon.style.setProperty('--icon', source.style.getPropertyValue('--icon'));
  icon?.setAttribute('aria-label', 'Play');
}

function restore(player) {
  const engine = engineOf(player);
  const box = player.querySelector('.video-comment');
  if (!engine || !box) return;
  const variation = variationOf(engine);

  if (!variation) {
    box.classList.remove('cp-in-variation');
    const blocks = toArray(box.children).filter(isBlock);
    savedBlocks.set(player, blocks.length ? blocks : null);
    return;
  }

  box.classList.add('cp-in-variation');
  const saved = savedBlocks.get(player);
  const content = variation.contentEl;
  if (saved && content && saved.some((block) => block.contains(content))) {
    const present = toArray(box.children).filter(isBlock);
    const intact = present.length === saved.length && saved.every((block, i) => present[i] === block);
    if (!intact) {
      present.forEach((block) => block.remove());
      saved.forEach((block) => box.append(block));
    }
  } else if (content && !box.contains(content)) {
    box.append(content);
  }
  ensurePlayButton(box);
}

// Capture phase: runs ahead of ChessPublica's own handlers.
function onClick(player, event) {
  const engine = engineOf(player);
  const variation = variationOf(engine);
  const target = event.target;
  if (!target?.closest) return;

  // Play from inside a variation: back to the mainline position it branched
  // from, and carry on from there.
  if (variation && target.closest('.comment-play-btn')) {
    event.stopPropagation();
    event.preventDefault();
    const index = variation.mainStateIndex;
    engine.exitVariation();
    engine.goTo(index);
    engine.play();
    return;
  }

  // A move in a different variation than the current one: leave the current
  // one first so ChessPublica does not stack it as a parent, and so only one
  // move stays highlighted. A move in a variation nested inside the current
  // one is a real parent/child step and is left alone.
  const move = target.closest('.var-move');
  if (!move) return;
  if (variation?.contentEl) {
    const list = move.closest('.variation-content');
    const nested = list !== variation.contentEl && variation.contentEl.contains(list);
    if (!nested) engine.exitVariation();
  }
  const box = player.querySelector('.video-comment');
  box?.querySelectorAll('.var-move.active').forEach((m) => m.classList.remove('active'));
}

export function installVariationFix(body, watcher) {
  body.querySelectorAll('pgn-player').forEach((player) => {
    watcher.subscribe(() => restore(player), { scope: player });
    player.addEventListener('click', (event) => onClick(player, event), true);
  });
}

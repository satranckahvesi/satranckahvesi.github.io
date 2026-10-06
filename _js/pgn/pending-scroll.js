// After a view switch reloads the page, scroll the block the reader just
// switched into place. A study does this itself (see chesspublica/study).

import { centerWhenSettled, contentQuiet, elementReady } from '../lib/scroll.js';
import { clearPendingCenter } from './view-state.js';

// What each view needs to finish rendering before its height can be measured.
// ChessPublica fires no ready signal for a plain <pgn>: it keeps appending
// content for a long time (900+ mutations for a long game), so wait for it to go quiet.
const READY = {
  pgn: (wrapper, watcher) => contentQuiet(watcher, wrapper, () => !!wrapper.querySelector('.pgn-container')),
  'pgn-player': (wrapper) => elementReady(wrapper.querySelector('pgn-player'))
};

/**
 * @param {string|null} pendingKey block key a view switch asked to scroll to
 * @param {{ view: string, wrapper: Element }|null} pendingBlock that block on this page, from buildPgnBlocks
 * @param {ReturnType<import('../lib/dom-watch.js').createWatcher>} watcher
 * @param {Promise<void>} imagesSized image space reserved; the block's position depends on it
 * @param {() => void} onScroll called once the page has been scrolled to the block, or at once
 *   when there is nothing to scroll to
 * @returns {Promise<void>} resolves when the scroll has settled (immediately when there is none)
 */
export function scrollPendingBlockIntoView(pendingKey, pendingBlock, watcher, imagesSized, onScroll) {
  if (!pendingKey) {
    onScroll();
    return Promise.resolve();
  }
  const ready = READY[pendingBlock?.view];
  if (!ready) {
    // A study scrolls itself; anything else (or no block) means nothing will consume it.
    if (pendingBlock?.view !== 'pgn-study') clearPendingCenter();
    onScroll();
    return Promise.resolve();
  }
  const { wrapper } = pendingBlock;
  // Aligned to the top: a full game can be thousands of pixels tall, and the
  // switcher the reader just used should stay in view.
  return centerWhenSettled(wrapper, {
    align: 'top',
    ready: Promise.all([ready(wrapper, watcher), imagesSized]),
    onScroll
  }).then(clearPendingCenter);
}

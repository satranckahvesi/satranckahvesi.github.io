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
 */
export function scrollPendingBlockIntoView(pendingKey, pendingBlock, watcher) {
  if (!pendingKey) return;
  const ready = READY[pendingBlock?.view];
  if (!ready) {
    // A study scrolls itself; anything else (or no block) means nothing will consume it.
    if (pendingBlock?.view !== 'pgn-study') clearPendingCenter();
    return;
  }
  const { wrapper } = pendingBlock;
  // Aligned to the top: a full game can be thousands of pixels tall, and the
  // switcher the reader just used should stay in view.
  centerWhenSettled(wrapper, { align: 'top', ready: ready(wrapper, watcher) }).then(clearPendingCenter);
}

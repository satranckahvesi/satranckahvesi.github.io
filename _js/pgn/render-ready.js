// Resolves once the page's ChessPublica boards have drawn themselves, so that a cover placed
// over the page (the installed app's refresh notice) can come off onto a finished article.

import { contentQuiet, imagesSettled } from '../lib/scroll.js';

// Never wait longer than this for the placeholders to be looked at.
const FIRST_PASS_MAX_MS = 3000;

const loaded = new Promise((resolve) => {
  if (document.readyState === 'complete') resolve();
  else window.addEventListener('load', resolve, { once: true });
});

/**
 * @param {Element} body the article body
 * @param {ReturnType<import('../lib/dom-watch.js').createWatcher>} watcher
 * @param {Promise<void>} firstPass resolves when the boards near the top are drawn (lazy-boards.js)
 * @param {Promise<void>} playersReady every <pgn-player> and <pgn-study> ready, from allElementsReady().
 *   It has to be created before ChessPublica runs: an element that is already ready only tells
 *   late listeners by an event they have missed, so asking afterwards waits for the timeout.
 */
export async function boardsRendered(body, watcher, firstPass, playersReady) {
  // ChessPublica is a deferred script: the load event comes after it has run and started drawing.
  await loaded;
  await Promise.race([firstPass, new Promise((resolve) => setTimeout(resolve, FIRST_PASS_MAX_MS))]);

  // Boards still held back as placeholders are drawn later, as the reader nears them.
  const drawnBlocks = Array.from(body.querySelectorAll('.pgn-switcher-block')).filter((wrapper) => !wrapper.querySelector('.board-lazy'));
  // Same rule as pending-scroll.js: a plain <pgn> sends no ready signal, so wait for it to go quiet.
  const texts = drawnBlocks
    .filter((wrapper) => wrapper.querySelector('.pgn-switcher-btn.is-active')?.dataset.view === 'pgn')
    .map((wrapper) => contentQuiet(watcher, wrapper, () => !!wrapper.querySelector('.pgn-container')));
  const blocks = [...texts, playersReady];
  await Promise.all(blocks);

  // A bare diagram is drawn the moment ChessPublica scans, so it needs no waiting of its own; the
  // images beside it do (not the ones the browser loads only when they near the screen). Waiting for
  // the whole article to stop mutating does not work: a player keeps updating itself, which held
  // the notice up for the full CONTENT_MAX_WAIT_MS.
  await imagesSettled(body, undefined, { skipLazy: true });
}

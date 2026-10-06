// Resolves once the page's ChessPublica boards have drawn themselves, so that a cover placed
// over the page (the installed app's refresh notice) can come off onto a finished article.

import { contentQuiet, elementReady, imagesSettled } from '../lib/scroll.js';

const loaded = new Promise((resolve) => {
  if (document.readyState === 'complete') resolve();
  else window.addEventListener('load', resolve, { once: true });
});

/**
 * @param {Element} body the article body
 * @param {ReturnType<import('../lib/dom-watch.js').createWatcher>} watcher
 */
export async function boardsRendered(body, watcher) {
  // ChessPublica is a deferred script: the load event comes after it has run and started drawing.
  await loaded;

  const blocks = Array.from(body.querySelectorAll('.pgn-switcher-block'), (wrapper) => {
    const view = wrapper.querySelector('.pgn-switcher-btn.is-active')?.dataset.view;
    // Same rule as pending-scroll.js: a plain <pgn> sends no ready signal, so wait for it to go quiet.
    return view === 'pgn'
      ? contentQuiet(watcher, wrapper, () => !!wrapper.querySelector('.pgn-container'))
      : elementReady(wrapper.querySelector(view));
  });
  await Promise.all(blocks);

  // Diagrams outside the switcher blocks, and the images next to them.
  await Promise.all([contentQuiet(watcher, body, () => true), imagesSettled(body)]);
}

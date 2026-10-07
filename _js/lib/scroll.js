import {
  CONTENT_MAX_WAIT_MS,
  CONTENT_QUIET_MS,
  IMAGE_SETTLE_TIMEOUT_MS,
  SCROLL_HOLD_MAX_MS,
  SCROLL_HOLD_MS,
  SCROLL_TOP_MARGIN_PX
} from './timing.js';

/**
 * Resolves once every image inside `el` has loaded or failed (or the timeout hits). With
 * `skipLazy`, images the browser holds back until they near the screen are not waited for.
 */
export function imagesSettled(el, timeoutMs = IMAGE_SETTLE_TIMEOUT_MS, { skipLazy = false } = {}) {
  const images = [...el.querySelectorAll('img')].filter((img) => !(skipLazy && img.loading === 'lazy' && !img.complete));
  return new Promise((resolve) => {
    let remaining = images.length;
    if (!remaining) {
      resolve();
      return;
    }
    const timer = setTimeout(resolve, timeoutMs);
    images.forEach((img) => {
      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        if (--remaining <= 0) {
          clearTimeout(timer);
          resolve();
        }
      };
      img.addEventListener('load', settle, { once: true });
      img.addEventListener('error', settle, { once: true });
      if (img.complete) settle();
    });
  });
}

/**
 * Resolves once `el` has stopped mutating for CONTENT_QUIET_MS and `isReady()`
 * holds, or after CONTENT_MAX_WAIT_MS regardless.
 */
export function contentQuiet(watcher, el, isReady) {
  return new Promise((resolve) => {
    let quietTimer;
    const finish = () => {
      clearTimeout(quietTimer);
      clearTimeout(maxTimer);
      unsubscribe();
      resolve();
    };
    const arm = () => {
      clearTimeout(quietTimer);
      quietTimer = setTimeout(() => isReady() && finish(), CONTENT_QUIET_MS);
    };
    const maxTimer = setTimeout(finish, CONTENT_MAX_WAIT_MS);
    const unsubscribe = watcher.subscribe(arm, { scope: el, types: ['childList'] });
    arm();
  });
}

/**
 * Resolves when a ChessPublica element (<pgn-player>, <pgn-study>) reports it is
 * ready, via its `cp-ready` class or event, or after CONTENT_MAX_WAIT_MS.
 */
export function elementReady(el) {
  return new Promise((resolve) => {
    if (!el || el.classList.contains('cp-ready')) {
      resolve();
      return;
    }
    const timer = setTimeout(resolve, CONTENT_MAX_WAIT_MS);
    el.addEventListener(
      'cp-ready',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true }
    );
  });
}

/**
 * Resolves once every ChessPublica element (<pgn-player>, <pgn-study>) inside
 * `root` is ready. Other blocks above the scroll target change the page height
 * as they render, so the target's position is only stable after all of them.
 */
export function allElementsReady(root) {
  const els = root.querySelectorAll('pgn-player, pgn-study');
  return Promise.all(Array.from(els, elementReady)).then(() => {});
}

// Applies the scroll target on every frame for SCROLL_HOLD_MS: layout can still
// shift under it, and a single scrollTo is not reliable. The target is measured again each
// frame, so a shift moves the scroll with it; while the page keeps changing height (boards
// drawn near the target) the hold is extended, up to SCROLL_HOLD_MAX_MS. Any wheel, touch or
// key input by the reader cancels it immediately. Resolves when the hold ends.
function holdScroll(topOf) {
  const abort = new AbortController();
  let interrupted = false;
  const interrupt = () => {
    interrupted = true;
    abort.abort();
  };
  for (const type of ['wheel', 'touchmove', 'keydown']) {
    window.addEventListener(type, interrupt, { passive: true, once: true, signal: abort.signal });
  }
  return new Promise((resolve) => {
    const hardStop = Date.now() + SCROLL_HOLD_MAX_MS;
    let deadline = Date.now() + SCROLL_HOLD_MS;
    let height = document.documentElement.scrollHeight;
    (function reassert() {
      if (interrupted) return resolve();
      window.scrollTo(0, topOf());
      const now = Date.now();
      const newHeight = document.documentElement.scrollHeight;
      if (newHeight !== height) {
        height = newHeight;
        deadline = now + SCROLL_HOLD_MS;
      }
      if (now < Math.min(deadline, hardStop)) {
        requestAnimationFrame(reassert);
      } else {
        abort.abort();
        resolve();
      }
    })();
  });
}

/**
 * Scrolls `el` into position once it has finished rendering.
 *
 * @param {Element} el
 * @param {object} [options]
 * @param {'center'|'top'} [options.align] where `el` ends up in the viewport
 * @param {Promise<void>} [options.ready] extra condition to wait for first
 * @param {() => void} [options.onScroll] called right after the first scroll has been issued
 * @returns {Promise<void>} resolves when the scroll has been held long enough to stay put
 */
export async function centerWhenSettled(el, { align = 'center', ready, onScroll } = {}) {
  if (ready) await ready;
  await imagesSettled(el);
  const topOf = () => {
    const rect = el.getBoundingClientRect();
    const top =
      align === 'top'
        ? rect.top + window.scrollY - SCROLL_TOP_MARGIN_PX
        : rect.top + window.scrollY + rect.height / 2 - window.innerHeight / 2;
    return Math.max(0, top);
  };
  const held = holdScroll(topOf);
  onScroll?.();
  await held;
}

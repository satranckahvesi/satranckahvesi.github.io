// Site-specific behavior for <pgn-study>: layout, a trimmed ribbon, keyboard
// stepping, and scrolling a freshly opened study into place.

import { toArray } from '../../lib/dom.js';
import { centerWhenSettled } from '../../lib/scroll.js';
import { BLOCK_KEY_ATTR, clearPendingCenter } from '../../pgn/view-state.js';
import { disableAutoplayLoop, disableVariationLoop, studyEngine } from '../engine.js';
import { resolveBranch } from './branch.js';
import { activateEngineFor, installKeyboard } from './keyboard.js';
import { createCommentMirror } from './mobile-comment.js';
import { addNavButtons, pruneRibbon } from './ribbon.js';

const COLUMN_WIDTHS = { '--left-col-width': '1fr', '--right-col-width': '2fr' };

/**
 * @param {Element} body article body
 * @param {ReturnType<import('../../lib/dom-watch.js').createWatcher>} watcher
 * @param {string|null} pendingCenterKey block to scroll into place once ready
 * @param {Promise<void>} imagesSized image space reserved; the study's position depends on it
 */
export function installStudyEnhancements(body, watcher, pendingCenterKey, imagesSized) {
  const studies = toArray(body.querySelectorAll('pgn-study'));
  if (!studies.length) return;

  const setActive = installKeyboard(studies);
  let pendingKey = pendingCenterKey;

  for (const study of studies) {
    const mirror = createCommentMirror(study);
    let ready = false;

    // Only the custom properties are set, never grid-template-columns, so the
    // stylesheet's own var() rule (and the drag splitter) keeps working.
    function layoutColumns() {
      for (const [name, value] of Object.entries(COLUMN_WIDTHS)) study.style.setProperty(name, value);
    }

    function centerIfPending() {
      if (!pendingKey || study.getAttribute(BLOCK_KEY_ATTR) !== pendingKey) return;
      pendingKey = null;
      centerWhenSettled(study, { ready: imagesSized }).then(clearPendingCenter);
    }

    function onReady() {
      layoutColumns();
      // A board click and the branch picker both call play(); replacing the
      // continuous loops (mainline and variation) leaves their single step intact and stops autoplay.
      const engine = studyEngine(study);
      if (engine) {
        disableAutoplayLoop(engine);
        disableVariationLoop(engine);
      }
      pruneRibbon(study);
      addNavButtons(study);

      // Clicking the move a branch picker is already showing for is a no-op
      // in ChessPublica; the picker's mainline row has to be clicked instead.
      study.querySelector('.pgn-container')?.addEventListener('click', (e) => {
        const move = e.target.closest('.pgn-move[data-ply]');
        const current = studyEngine(study)?.state?.index;
        if (move && Number(move.dataset.ply) === current) resolveBranch(study);
      });

      mirror.ensure();
      // A fresh study must already own keyboard focus on the reader's first key.
      study.dispatchEvent(new MouseEvent('mouseenter'));
      activateEngineFor(study);
      setActive(study);
      centerIfPending();
    }

    // Collapsing is disabled outright: besides the removed button, the panel
    // itself is click-to-expand, so the class is stripped whenever it appears.
    // Guarded: classList.remove on an absent token still queues a mutation
    // record, which would re-trigger this very observer.
    function stripCollapsed() {
      if (study.classList.contains('pgn-study-collapsed')) study.classList.remove('pgn-study-collapsed');
    }

    function update() {
      stripCollapsed();
      if (!ready && study.classList.contains('cp-ready')) {
        ready = true;
        onReady();
      }
      mirror.keepLast();
      mirror.sync();
    }

    stripCollapsed();
    resolveBranch(study);
    if (study.classList.contains('cp-ready')) {
      ready = true;
      onReady();
    }
    watcher.subscribe(update, { scope: study, types: ['childList', 'attributes'] });
  }
}

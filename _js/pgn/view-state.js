// Per-tab memory of which view each PGN block is shown in, and of which block
// should be scrolled into place after the page reload a view switch causes.
// Shared by the view switcher, the PGN block builder and the study enhancer.

import { readSession, removeSession, writeSession } from '../lib/session.js';

export const VIEWS = ['pgn', 'pgn-player', 'pgn-study'];
export const DEFAULT_VIEW = 'pgn';
export const BLOCK_KEY_ATTR = 'data-pgn-block-key';

const PENDING_CENTER_KEY = 'pgn-center-pending';
const BLOCK_KEY_PREFIX = `pgn-view:${location.pathname}:`;

export const blockKey = (index) => `${BLOCK_KEY_PREFIX}${index}`;

export const readView = (key) => {
  const view = readSession(key);
  return VIEWS.includes(view) ? view : null;
};
export const saveView = (key, view) => writeSession(key, view);
export const forgetView = (key) => removeSession(key);

/**
 * The block key a previous view switch asked to be scrolled into place, if it
 * belongs to this page. Browser scroll restoration is switched off for the
 * rest of the load so it cannot fight the deliberate scroll that follows.
 */
export function takePendingCenter() {
  const key = readSession(PENDING_CENTER_KEY);
  if (!key) return null;
  if (!key.startsWith(BLOCK_KEY_PREFIX)) {
    clearPendingCenter();
    return null;
  }
  history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  return key;
}

export function requestCenter(key) {
  writeSession(PENDING_CENTER_KEY, key);
  history.scrollRestoration = 'manual';
}

export function clearPendingCenter() {
  removeSession(PENDING_CENTER_KEY);
  history.scrollRestoration = 'auto';
}

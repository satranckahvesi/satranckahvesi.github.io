import { BLOCK_KEY_ATTR, forgetView, readView, requestCenter, saveView } from './view-state.js';
import { VIEW_CONFIG } from './views.js';

// ChessPublica scans the DOM once on load, so a block cannot change view in
// place: the choice is stored and the page reloaded.
function chooseView(key, view, allKeys) {
  if (view === 'pgn-study') {
    // Only one big study panel at a time. Dropping the other blocks' choice
    // (instead of forcing 'pgn') returns a puzzle to its own default view.
    for (const other of allKeys) {
      if (other !== key && readView(other) === 'pgn-study') forgetView(other);
    }
  }
  // Every view has a different height, and the page keeps growing while
  // ChessPublica renders after the reload, so native scroll restoration lands
  // anywhere. The block is scrolled into place explicitly instead.
  requestCenter(key);
  saveView(key, view);
  location.reload();
}

function viewItem(view, activeView, onChoose) {
  const isActive = view.key === activeView;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = `pgn-switcher-btn${isActive ? ' is-active' : ''}`;
  button.dataset.view = view.key;
  button.setAttribute('aria-pressed', String(isActive));
  button.setAttribute('aria-label', view.label);
  button.innerHTML = view.icon;
  button.addEventListener('click', () => onChoose(view.key));

  // The visible caption duplicates the button's aria-label, so screen readers
  // skip it; it stays clickable like a <label>. Always two lines
  // (white-space: pre-line turns the newline into the break).
  const caption = document.createElement('span');
  caption.className = `pgn-switcher-caption${isActive ? ' is-active' : ''}`;
  caption.setAttribute('aria-hidden', 'true');
  caption.textContent = view.label.replace(' ', '\n');
  caption.addEventListener('click', () => button.click());

  const item = document.createElement('div');
  item.className = 'pgn-switcher-item';
  item.append(button, caption);
  return item;
}

/**
 * Wraps `boardEl` in a block with a view switcher above it.
 *
 * ChessPublica replaces a plain <pgn> element wholesale and drops its
 * attributes, so the block key is stamped on the wrapper, which it never
 * touches.
 */
export function createSwitcherBlock({ boardEl, key, activeView, allKeys }) {
  const switcher = document.createElement('div');
  switcher.className = 'pgn-switcher';
  switcher.setAttribute('role', 'group');
  switcher.setAttribute('aria-label', 'Görünüm seçimi');
  for (const view of VIEW_CONFIG) {
    switcher.append(viewItem(view, activeView, (chosen) => chooseView(key, chosen, allKeys)));
  }

  const wrap = document.createElement('div');
  wrap.className = 'pgn-switcher-block';
  wrap.setAttribute(BLOCK_KEY_ATTR, key);
  wrap.append(switcher, boardEl);
  return wrap;
}

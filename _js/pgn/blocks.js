// Turns the raw `[Tag "value"]` header paragraphs authors write in Markdown
// into ChessPublica elements (<pgn>, <fen>, <pgn-player>, <pgn-study>).

import { isItalicCaption, toArray } from '../lib/dom.js';
import { pgnText } from './markdown-text.js';
import { PUZZLE_MARKER_RE, puzzleMoverColor, stripPuzzleMarkers } from './puzzle.js';
import { createSwitcherBlock } from './view-switcher.js';
import { BLOCK_KEY_ATTR, DEFAULT_VIEW, blockKey, forgetView, readView } from './view-state.js';

const HEADER_LINE_RE = /^\[[A-Za-z]+\s+"/;
const FEN_TAG_RE = /^\[FEN\s+"/;
const ORIENTATION_TAG_RE = /^\[Orientation\s+"/i;
const MOVETEXT_RE = /^(\{|\d+\.)/;
const RESULT_RE = /^(\*|1-0|0-1|1\/2-1\/2)$/;
// Site-specific pseudo-header (not PGN): crops a bare <fen> diagram to a half
// or a quarter of the board. Removed before ChessPublica sees it.
const CROP_TAG_RE =
  /^\[Crop\s+"(top-half|bottom-half|top-left-quarter|top-right-quarter|bottom-left-quarter|bottom-right-quarter)"\]$/i;

const nonEmptyLines = (text) =>
  text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

/** The movetext that belongs to a header paragraph, and the sibling element it came from. */
function findMoveText(p, inlineMoveText) {
  if (inlineMoveText !== null) {
    return { moveText: MOVETEXT_RE.test(inlineMoveText) ? inlineMoveText : null, source: null };
  }
  const next = p.nextElementSibling;
  if (!next) return { moveText: null, source: null };

  if (next.tagName === 'P') {
    const text = pgnText(next).trim();
    if (MOVETEXT_RE.test(text)) return { moveText: text, source: next };
    // A bare result token ("*") after a header-only diagram is part of the PGN.
    return { moveText: null, source: RESULT_RE.test(text) ? next : null };
  }
  if (next.tagName === 'OL') {
    // "1. e4 ..." is parsed by Markdown as an ordered list, which strips the
    // "1. " marker: add it back to get valid movetext.
    const items = toArray(next.querySelectorAll('li')).map((li) => pgnText(li).trim());
    return { moveText: items.length ? `1. ${items.join(' ')}` : null, source: next };
  }
  return { moveText: null, source: null };
}

/** Reads one header paragraph; null when `p` is not a PGN/FEN block. */
function parseBlock(p) {
  const lines = nonEmptyLines(pgnText(p));
  if (!lines.length || !HEADER_LINE_RE.test(lines[0])) return null;

  let headerEnd = 0;
  while (headerEnd < lines.length && HEADER_LINE_RE.test(lines[headerEnd])) headerEnd++;
  // Movetext on the same paragraph as the header (a puzzle's solution right
  // below its header, with no blank line).
  const inlineMoveText = headerEnd < lines.length ? lines.slice(headerEnd).join(' ') : null;

  let headerLines = lines.slice(0, headerEnd);
  const hasFenTag = headerLines.some((l) => FEN_TAG_RE.test(l));
  let crop = null;
  headerLines = headerLines.filter((line) => {
    const match = line.match(CROP_TAG_RE);
    if (match) crop = match[1].toLowerCase();
    return !match;
  });

  const { moveText, source } = findMoveText(p, inlineMoveText);
  // A header + movetext pair is a game, whatever position it starts from. A
  // lone [FEN] header is a static diagram. Anything else is not a chess block.
  const kind = moveText !== null ? 'pgn' : hasFenTag ? 'fen' : null;
  return kind && { kind, headerLines, moveText, crop, source };
}

/** Which element to build for a game: puzzles open in the player, a saved choice wins. */
function resolveView(parsed, key) {
  const isPuzzle = PUZZLE_MARKER_RE.test(parsed.moveText);
  let view = isPuzzle ? 'pgn-player' : DEFAULT_VIEW;
  const saved = readView(key);
  if (saved) {
    view = saved;
    // A puzzle honors the switch for the reload it triggers, but is not
    // remembered past it: puzzles should keep opening in the player.
    if (isPuzzle) forgetView(key);
  }
  return { view, isPuzzle };
}

function buildElement(tagName, headerText, moveText) {
  const el = document.createElement(tagName);
  el.textContent = moveText !== null ? `${headerText}\n\n${moveText}` : headerText;
  return el;
}

// "Find the best move for Black" with the board drawn from White's side is
// disorienting. ChessPublica honors [Orientation "black"] but never infers it.
function needsBlackOrientation(parsed) {
  return (
    !parsed.headerLines.some((l) => ORIENTATION_TAG_RE.test(l)) &&
    puzzleMoverColor(parsed.headerLines, parsed.moveText) === 'black'
  );
}

function cropWrapper(el, crop) {
  const wrap = document.createElement('div');
  wrap.className = `board-crop board-crop--${crop}`;
  wrap.append(el);
  return wrap;
}

// Two switcher blocks in a row with nothing between them get a short rule.
function separateAdjacentBlocks(switcherBlocks) {
  for (const wrap of switcherBlocks) {
    const prev = wrap.previousElementSibling;
    if (!prev || !prev.classList.contains('pgn-switcher-block')) continue;
    const divider = document.createElement('div');
    divider.className = 'pgn-divider';
    divider.setAttribute('aria-hidden', 'true');
    wrap.before(divider);
  }
}

/**
 * Replaces every header paragraph in `body` with its ChessPublica element.
 *
 * @param {Element} body article body
 * @param {string|null} pendingCenterKey block that should be scrolled into place afterwards
 * @returns {{ pendingBlock: { view: string, wrapper: Element }|null }} the view and wrapper of
 *   the block named by `pendingCenterKey`, if this page has it
 */
export function buildPgnBlocks(body, pendingCenterKey) {
  const allKeys = [];
  const switcherBlocks = [];
  let pendingBlock = null;
  let blockIndex = 0;

  for (const p of toArray(body.querySelectorAll('p'))) {
    if (!p.parentNode) continue;
    const parsed = parseBlock(p);
    if (!parsed) continue;

    let tagName = parsed.kind;
    let key = null;
    let isPuzzle = false;
    if (parsed.kind === 'pgn') {
      key = blockKey(blockIndex++);
      allKeys.push(key);
      ({ view: tagName, isPuzzle } = resolveView(parsed, key));
    }

    let headerText = parsed.headerLines.join('\n');
    if (tagName === 'pgn-player' && isPuzzle && needsBlackOrientation(parsed)) {
      headerText += '\n[Orientation "black"]';
    }
    // Quizzing the reader mid-article is jarring in the study view.
    const moveText =
      tagName === 'pgn-study' && parsed.moveText !== null
        ? stripPuzzleMarkers(parsed.moveText)
        : parsed.moveText;

    const el = buildElement(tagName, headerText, moveText);
    if (key) el.setAttribute(BLOCK_KEY_ATTR, key);

    let inserted = el;
    if (parsed.crop && tagName === 'fen') inserted = cropWrapper(el, parsed.crop);
    if (key) {
      inserted = createSwitcherBlock({ boardEl: el, key, activeView: tagName, allKeys });
      switcherBlocks.push(inserted);
      if (key === pendingCenterKey) pendingBlock = { view: tagName, wrapper: inserted };
    }

    p.before(inserted);
    p.remove();
    parsed.source?.remove();

    // An italic-only paragraph right after a bare diagram is its caption.
    if (tagName === 'fen' && isItalicCaption(inserted.nextElementSibling)) {
      inserted.nextElementSibling.classList.add('diagram-caption');
    }
  }

  separateAdjacentBlocks(switcherBlocks);
  return { pendingBlock };
}

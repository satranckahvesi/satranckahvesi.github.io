// Puzzle markers: a `[P]` / `[P n]` comment turns a position into a puzzle.

export const PUZZLE_MARKER_RE = /\[P\s*\d*\]/;
const PUZZLE_MARKER_GLOBAL_RE = /\[P\s*\d*\]/g;

export const stripPuzzleMarkers = (moveText) => moveText.replace(PUZZLE_MARKER_GLOBAL_RE, '');

const isMoveToken = (token) => {
  const stripped = token.replace(/^\d+\.+/, '');
  if (!stripped) return false; // bare move number: "31." / "31..."
  if (/^\$\d+$/.test(stripped)) return false; // NAG
  if (/^(1-0|0-1|1\/2-1\/2|\*)$/.test(stripped)) return false; // result
  return true;
};

function startingColor(headerLines) {
  for (const line of headerLines) {
    const m = line.match(/^\[FEN\s+"([^"]+)"\]/);
    if (!m) continue;
    const side = m[1].split(/\s+/)[1];
    return side === 'w' || side === 'b' ? side : 'w';
  }
  return 'w';
}

/**
 * Who is on move at the first mainline `[P]` marker: the side ChessPublica's
 * puzzle mode prompts for. Walks the raw movetext counting plies (no move
 * validation needed, only parity). Returns null when there is no such marker.
 */
export function puzzleMoverColor(headerLines, moveText) {
  const start = startingColor(headerLines);
  let plies = 0;
  let depth = 0;
  let pos = 0;
  while (pos < moveText.length) {
    const ch = moveText[pos];
    if (ch === '{') {
      let end = moveText.indexOf('}', pos + 1);
      if (end === -1) end = moveText.length;
      if (depth === 0 && PUZZLE_MARKER_RE.test(moveText.slice(pos + 1, end))) {
        return (plies % 2 === 0) === (start === 'w') ? 'white' : 'black';
      }
      pos = end + 1;
    } else if (ch === '(') {
      depth++;
      pos++;
    } else if (ch === ')') {
      depth = Math.max(0, depth - 1);
      pos++;
    } else if (/\s/.test(ch)) {
      pos++;
    } else {
      let end = pos;
      while (end < moveText.length && !/[\s{}()]/.test(moveText[end])) end++;
      if (depth === 0 && isMoveToken(moveText.slice(pos, end))) plies++;
      pos = end;
    }
  }
  return null;
}

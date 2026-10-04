// ChessPublica joins consecutive PGN comments ({ 1- A } { 2- B }) into one
// run of text, so a list written as separate comments ends up on one line.

const ITEM = /(^|\s)(\d{1,2})-\s/g;

/**
 * Offsets in `text` where the items of a "1- … 2- …" list begin: a number
 * counting up from 1, followed by a hyphen and a space. Fewer than two items
 * is not a list (the text is returned untouched), and text that has already
 * been split gives no new break points.
 *
 * @param {string} text
 * @returns {number[]}
 */
export function listItemOffsets(text) {
  const offsets = [];
  let expected = 1;
  for (const match of text.matchAll(ITEM)) {
    if (Number(match[2]) !== expected) continue;
    offsets.push(match.index + match[1].length);
    expected++;
  }
  return offsets.length >= 2 ? offsets : [];
}

/**
 * Splits `text` into the pieces on either side of every list item start.
 * Whitespace at the break is dropped.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function splitListItems(text) {
  const offsets = listItemOffsets(text);
  if (!offsets.length) return [text];
  const pieces = [];
  let from = 0;
  for (const offset of offsets) {
    pieces.push(text.slice(from, offset).trimEnd());
    from = offset;
  }
  pieces.push(text.slice(from));
  return pieces.filter((piece) => piece !== '');
}

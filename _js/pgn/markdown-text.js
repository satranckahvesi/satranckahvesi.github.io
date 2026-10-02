// kramdown has already turned **bold**, *italic* and [links](url) inside a PGN
// {comment} into <strong>/<em>/<a> by the time the page script runs. This puts
// that Markdown back inside {...} (ChessPublica renders it) and drops the tags
// everywhere else, so stray emphasis around moves never reaches the PGN parser.

const BOLD = '';
const EM = '';
const LINK_OPEN = '';
const LINK_MID = '';
const LINK_CLOSE = '';

function markedText(node) {
  let out = '';
  for (let n = node.firstChild; n; n = n.nextSibling) {
    if (n.nodeType === Node.TEXT_NODE) {
      out += n.nodeValue;
    } else if (n.nodeType === Node.ELEMENT_NODE) {
      const inner = markedText(n);
      const href = n.getAttribute('href');
      if (n.tagName === 'STRONG' || n.tagName === 'B') out += BOLD + inner + BOLD;
      else if (n.tagName === 'EM' || n.tagName === 'I') out += EM + inner + EM;
      else if (n.tagName === 'A' && href) out += LINK_OPEN + inner + LINK_MID + href + LINK_CLOSE;
      else if (n.tagName === 'BR') out += '\n';
      else out += inner;
    }
  }
  return out;
}

/** Plain PGN text of `node`, with Markdown restored inside comments only. */
export function pgnText(node) {
  const marked = markedText(node);
  let out = '';
  let depth = 0;
  let link = false; // false | true (link text) | 'url'
  for (const c of marked) {
    if (c === '{') depth++;
    else if (c === '}' && depth > 0) depth--;

    if (c === BOLD) {
      if (depth) out += '**';
    } else if (c === EM) {
      if (depth) out += '*';
    } else if (c === LINK_OPEN) {
      if (depth) out += '[';
      else link = true;
    } else if (c === LINK_MID) {
      if (depth) out += '](';
      else link = 'url';
    } else if (c === LINK_CLOSE) {
      if (depth) out += ')';
      else link = false;
    } else if (link !== 'url') {
      out += c;
    }
  }
  return out;
}

// Pure text transforms: straight quotes to curly quotes, "--" to an em dash.

// "--" becomes "—" unless it stands alone between whitespace (the null-move
// token in PGN movetext) or is part of a longer run of hyphens.
export function toEmDashes(text) {
  return text.replace(/(^|[^-])--(?!-)/g, (match, before, offset, whole) => {
    const after = whole.charAt(offset + match.length);
    const aloneBefore = before === '' || /\s/.test(before);
    const aloneAfter = after === '' || /\s/.test(after);
    return aloneBefore && aloneAfter ? match : `${before}—`;
  });
}

// A conventional SmartyPants pass: a quote after whitespace, an opening
// bracket or the start of the text opens; every other one closes (which is
// also the right character for an apostrophe, e.g. "İstanbul'da").
export function toCurly(text) {
  return toEmDashes(text)
    .replace(/(^|[-—\s([{"])'/g, '$1‘')
    .replace(/'/g, '’')
    .replace(/(^|[-—\s([{'])"/g, '$1“')
    .replace(/"/g, '”');
}

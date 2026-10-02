// Links to other sites open in a new tab; links within this site never do.

export function markExternalLink(anchor) {
  const isWeb = anchor.protocol === 'http:' || anchor.protocol === 'https:';
  if (!isWeb || anchor.origin === location.origin || anchor.target) return;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
}

export function markExternalLinks(root) {
  root?.querySelectorAll('a[href]').forEach(markExternalLink);
}

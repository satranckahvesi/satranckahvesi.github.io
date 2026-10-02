// Wraps each article image in a <figure>. The caption is the image's title
// attribute or, for a standalone image, an italic-only paragraph right after it.

import { isItalicCaption, toArray } from './lib/dom.js';

export function wrapFigures(body) {
  for (const img of toArray(body.querySelectorAll('img'))) {
    if (img.closest('figure')) continue;

    const host = img.parentNode;
    const standalone = host.tagName === 'P' && host.childNodes.length === 1;
    let caption = null; // { node?: Element, html?: string, text?: string }

    if (img.title) {
      caption = { text: img.title };
      img.removeAttribute('title');
    } else if (standalone && isItalicCaption(host.nextElementSibling)) {
      caption = { node: host.nextElementSibling };
    }

    // Lets CSS size the image before it loads (see .post-figure img in post.css).
    img.style.setProperty('--w', img.getAttribute('width'));
    img.style.setProperty('--h', img.getAttribute('height'));

    const figure = document.createElement('figure');
    figure.className = 'post-figure';
    host.before(figure);
    figure.append(img);

    if (caption) {
      const figcaption = document.createElement('figcaption');
      if (caption.node) figcaption.innerHTML = caption.node.firstElementChild.innerHTML;
      else figcaption.textContent = caption.text;
      figure.append(figcaption);
      caption.node?.remove();
    }
    if (standalone) host.remove();
  }
}

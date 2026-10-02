// Wraps each article image in a <figure>. The caption is the image's title
// attribute or, for a standalone image, an italic-only paragraph right after it.

import { isItalicCaption, toArray } from './lib/dom.js';
import { probeImageSize } from './lib/image-size.js';
import { IMAGE_SETTLE_TIMEOUT_MS } from './lib/timing.js';

// Sets the size CSS needs to reserve the image's space (see .post-figure img in post.css).
function reserveSpace(img, width, height) {
  img.style.setProperty('--w', width);
  img.style.setProperty('--h', height);
  img.setAttribute('width', width);
  img.setAttribute('height', height);
}

// Authors do not write width/height, so the size is read from the file itself:
// from the decoded image when it is already there, else from its first bytes.
function sizeImage(img) {
  const width = img.getAttribute('width');
  const height = img.getAttribute('height');
  if (width && height) {
    reserveSpace(img, width, height);
    return Promise.resolve();
  }
  if (img.complete && img.naturalWidth) {
    reserveSpace(img, img.naturalWidth, img.naturalHeight);
    return Promise.resolve();
  }
  return probeImageSize(img.currentSrc || img.src, IMAGE_SETTLE_TIMEOUT_MS).then((size) => {
    if (size) reserveSpace(img, size.width, size.height);
  });
}

/** @returns {Promise<void>} resolves once every image's space has been reserved (or its size could not be found) */
export function wrapFigures(body) {
  const sized = [];
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

    sized.push(sizeImage(img));

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
  return Promise.all(sized).then(() => {});
}

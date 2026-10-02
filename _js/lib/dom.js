export const toArray = (list) => Array.from(list);

export const isElement = (node) => node.nodeType === Node.ELEMENT_NODE;

/** True when `el` is a plain `<p>` holding nothing but a single `<em>` (an image/diagram caption). */
export function isItalicCaption(el) {
  return (
    el &&
    el.tagName === 'P' &&
    el.children.length === 1 &&
    el.firstElementChild.tagName === 'EM' &&
    el.textContent.trim() === el.firstElementChild.textContent.trim()
  );
}

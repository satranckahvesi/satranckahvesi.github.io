// One MutationObserver for the whole article. Everything that reacts to
// ChessPublica rendering subscribes here instead of creating its own observer.

const OBSERVE = {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
  attributeFilter: ['class']
};

/**
 * @param {Element} root element to observe (the article body)
 */
export function createWatcher(root) {
  const subscribers = new Set();

  const observer = new MutationObserver((records) => {
    for (const sub of [...subscribers]) {
      const mine = records.filter((r) => sub.types.has(r.type) && sub.scope.contains(r.target));
      if (mine.length) sub.handler(mine);
    }
  });
  observer.observe(root, OBSERVE);

  /**
   * Calls `handler(records)` once per mutation batch with the records of the
   * given `types` that happened inside `scope`. Returns an unsubscribe function.
   */
  function subscribe(handler, { scope = root, types = ['childList'] } = {}) {
    const sub = { handler, scope, types: new Set(types) };
    subscribers.add(sub);
    return () => subscribers.delete(sub);
  }

  /** Calls `callback(el)` for every matching element now and every one added later. */
  function onAppear(selector, callback, { scope = root } = {}) {
    scope.querySelectorAll(selector).forEach(callback);
    return subscribe(
      (records) => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            if (node.matches(selector)) callback(node);
            node.querySelectorAll(selector).forEach(callback);
          }
        }
      },
      { scope, types: ['childList'] }
    );
  }

  return { subscribe, onAppear };
}

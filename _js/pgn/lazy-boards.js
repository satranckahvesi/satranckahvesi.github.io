// Draws boards only as they come near the screen. A long article can hold dozens of games and
// diagrams, and ChessPublica builds each one on the page's main thread as soon as it finds it,
// which kept the installed app busy for most of half a minute. Here a board waits, as a plain
// <div>, while its element is held back from the page; when the placeholder is within reach of the
// viewport the element takes its place, and ChessPublica is asked to scan again (it skips what it
// has already drawn).

// How far from the viewport a board is drawn. About two screens ahead, so scrolling at a normal
// pace never meets an empty placeholder.
const REACH = '1600px 0px';

/** Called with the placeholders that came within reach, and the element each one stands for. */
function draw(drawn) {
  for (const [placeholder, el] of drawn) placeholder.replaceWith(el);
  // Scripts that run before ChessPublica need nothing here: its own first scan finds the element.
  window.ChessPublica?.initAll?.();
}

export function createLazyBoards() {
  const held = new Map();
  const supported = typeof IntersectionObserver !== 'undefined';
  let firstPassDone;
  const firstPass = new Promise((resolve) => {
    firstPassDone = resolve;
  });

  const observer =
    supported &&
    new IntersectionObserver(
      (entries) => {
        const drawn = [];
        for (const entry of entries) {
          const el = held.get(entry.target);
          if (!entry.isIntersecting || !el) continue;
          observer.unobserve(entry.target);
          held.delete(entry.target);
          drawn.push([entry.target, el]);
        }
        if (drawn.length) draw(drawn);
        // The first callback reports every observed placeholder once.
        firstPassDone();
      },
      { rootMargin: REACH }
    );

  // A printed page has no scrolling to wait for.
  window.addEventListener('beforeprint', () => {
    if (held.size) draw([...held]);
    for (const placeholder of held.keys()) observer.unobserve(placeholder);
    held.clear();
  });

  return {
    /** The node to put in the page for `el`: `el` itself where deferring is not possible. */
    defer(el, kind) {
      if (!observer) return el;
      const placeholder = document.createElement('div');
      placeholder.className = `board-lazy board-lazy--${kind}`;
      placeholder.setAttribute('aria-hidden', 'true');
      held.set(placeholder, el);
      return placeholder;
    },

    /** Resolves once the first batch of boards (the ones near the viewport) is drawn. */
    firstPass,

    /** Starts watching the placeholders; call once they are in the page. */
    start() {
      if (!held.size) firstPassDone();
      for (const placeholder of held.keys()) observer.observe(placeholder);
    }
  };
}

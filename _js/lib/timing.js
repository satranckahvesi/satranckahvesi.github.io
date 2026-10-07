// Every timing the page scripts depend on, in one place.

/** Stop waiting for a single image to load or error. */
export const IMAGE_SETTLE_TIMEOUT_MS = 3000;

/** A block that stopped mutating for this long is considered fully rendered. */
export const CONTENT_QUIET_MS = 300;

/** Give up waiting for a block to stop mutating and carry on regardless. */
export const CONTENT_MAX_WAIT_MS = 5000;

/** How long a scroll target is re-applied against late layout shifts. */
export const SCROLL_HOLD_MS = 1000;

/** The longest a scroll target is held, however long the layout keeps shifting. */
export const SCROLL_HOLD_MAX_MS = 10000;

/** Gap kept above a block that is aligned to the top of the viewport. */
export const SCROLL_TOP_MARGIN_PX = 16;

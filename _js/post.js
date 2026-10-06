// Entry for article pages. Order matters: PGN blocks must be replaced by their
// ChessPublica elements before ChessPublica's own script (loaded after this
// one) scans the page, and before curly quotes are applied.

import { installCommentList } from './chesspublica/comment-list.js';
import { installDiagramJoin } from './chesspublica/diagram-join.js';
import { installDiagramNoPause } from './chesspublica/diagram-no-pause.js';
import { installGlyphBadge } from './chesspublica/glyph-badge.js';
import { installLocalization } from './chesspublica/localize.js';
import { installStudyEnhancements } from './chesspublica/study/index.js';
import { installVariationFix } from './chesspublica/variation-fix.js';
import { installCookieConsent } from './consent.js';
import { markExternalLink } from './external-links.js';
import { createWatcher } from './lib/dom-watch.js';
import { allElementsReady } from './lib/scroll.js';
import { buildPgnBlocks } from './pgn/blocks.js';
import { boardsRendered } from './pgn/render-ready.js';
import { scrollPendingBlockIntoView } from './pgn/pending-scroll.js';
import { takePendingCenter } from './pgn/view-state.js';
import { wrapFigures } from './post-figures.js';
import { curlyPass, keepCommentsCurly } from './text/curly-quotes.js';
import { installAppButton } from './install-app.js';
import { installNavMenu } from './nav-menu.js';
import { installPushButton } from './push.js';
import { holdLoadNotice, installLinkNotice, installRefreshButton } from './refresh-app.js';
import { installServiceWorker } from './service-worker.js';
import { installThemeToggle } from './theme-toggle.js';

const body = document.querySelector('.post-body');

if (body) {
  const pendingCenterKey = takePendingCenter();
  const watcher = createWatcher(body);

  const figuresSized = wrapFigures(body);
  const { pendingBlock, firstPass } = buildPgnBlocks(body, pendingCenterKey);
  // The scroll target sits below other blocks whose rendering shifts the layout.
  const imagesSized = pendingCenterKey
    ? Promise.all([figuresSized, allElementsReady(body)]).then(() => {})
    : figuresSized;

  installStudyEnhancements(body, watcher, pendingCenterKey, imagesSized);
  installGlyphBadge(body, watcher);
  installDiagramJoin(body, watcher);
  installCommentList(body, watcher);
  installVariationFix(body, watcher);
  installDiagramNoPause(body);
  installLocalization(watcher);
  watcher.onAppear('a[href]', markExternalLink);

  curlyPass(document.body);
  keepCommentsCurly(body, watcher);

  scrollPendingBlockIntoView(pendingCenterKey, pendingBlock, watcher, imagesSized);
  holdLoadNotice(boardsRendered(body, watcher, firstPass));
} else {
  holdLoadNotice(Promise.resolve());
}

installThemeToggle();
installNavMenu();
installAppButton();
installPushButton();
installRefreshButton();
installLinkNotice();
installServiceWorker();
installCookieConsent();

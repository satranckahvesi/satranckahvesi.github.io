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
import { buildPgnBlocks } from './pgn/blocks.js';
import { scrollPendingBlockIntoView } from './pgn/pending-scroll.js';
import { takePendingCenter } from './pgn/view-state.js';
import { wrapFigures } from './post-figures.js';
import { curlyPass, keepCommentsCurly } from './text/curly-quotes.js';
import { installThemeToggle } from './theme-toggle.js';

const body = document.querySelector('.post-body');

if (body) {
  const pendingCenterKey = takePendingCenter();
  const watcher = createWatcher(body);

  const imagesSized = wrapFigures(body);
  const { pendingBlock } = buildPgnBlocks(body, pendingCenterKey);

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
}

installThemeToggle();
installCookieConsent();

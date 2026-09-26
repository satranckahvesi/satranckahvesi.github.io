(function () {
    // Opening a second pgn-study while one's already showing that view
    // (see the switcher's own click handler below) sets this, right
    // before reloading, to say which block should end up centered once
    // its own <pgn-study> is ready. Read as the very first thing this
    // script does, before .post-body is even looked up: a plain reload
    // otherwise restores whatever scroll position the reader was already
    // at (their own scrollRestoration: 'auto' default), and that restore
    // can happen before this script gets a chance to react — turning it
    // off here, as early as possible, is what keeps that from being a
    // visible jump on top of the deliberate one further down.
    var pgnCenterPending = null;
    try { pgnCenterPending = sessionStorage.getItem('pgn-center-pending'); } catch (e) {}
    if (pgnCenterPending) {
        history.scrollRestoration = 'manual';
        window.scrollTo(0, 0);
    }

    var body = document.querySelector('.post-body');
    if (!body) return;
    var headerLineRe = /^\[[A-Za-z]+\s+"/;
    var fenTagRe = /^\[FEN\s+"/;
    var orientationTagRe = /^\[Orientation\s+"/i;
    var movetextRe = /^(\{|\d+\.)/;
    var puzzleMarkerRe = /\[P\s*\d*\]/;
    // Site-specific pseudo-header, not part of PGN itself (like the [P]
    // puzzle marker below): tells a bare <fen> diagram to render only a
    // half (top/bottom four ranks) or a quarter (one 4x4 corner) of the
    // board. Stripped from the header before ChessPublica ever sees it,
    // same reasoning as [P] in <pgn-study> below — an unrecognized tag
    // would otherwise just sit there unused.
    var cropTagRe = /^\[Crop\s+"(top-half|bottom-half|top-left-quarter|top-right-quarter|bottom-left-quarter|bottom-right-quarter)"\]$/i;

    // Whoever is on move where the *first* mainline [P] marker sits is who
    // ChessPublica's puzzle mode will prompt for as soon as the viewer
    // loads (a marker buried in a sideline only matters once the reader
    // wanders into that sideline, so it can't drive the board's initial
    // orientation). Found by walking the raw movetext by hand rather than
    // asking Chess.js to replay it, since all that's needed is a ply count
    // parity, not a validated position.
    function puzzleMoverColor(headerLines, moveText) {
        var startColor = 'w';
        for (var i = 0; i < headerLines.length; i++) {
            var m = headerLines[i].match(/^\[FEN\s+"([^"]+)"\]/);
            if (m) {
                var side = m[1].split(/\s+/)[1];
                if (side === 'w' || side === 'b') startColor = side;
                break;
            }
        }

        function isMoveToken(tok) {
            var stripped = tok.replace(/^\d+\.+/, '');
            if (!stripped) return false; // bare move-number marker, e.g. "31." / "31..."
            if (/^\$\d+$/.test(stripped)) return false; // NAG, e.g. "$19"
            if (/^(1-0|0-1|1\/2-1\/2|\*)$/.test(stripped)) return false; // result
            return true;
        }

        var plyCount = 0;
        var variationDepth = 0;
        var pos = 0;
        var len = moveText.length;
        while (pos < len) {
            var ch = moveText[pos];
            if (ch === '{') {
                var end = moveText.indexOf('}', pos + 1);
                if (end === -1) end = len;
                if (variationDepth === 0 && puzzleMarkerRe.test(moveText.slice(pos + 1, end))) {
                    var isEvenPlies = plyCount % 2 === 0;
                    return isEvenPlies === (startColor === 'w') ? 'white' : 'black';
                }
                pos = end + 1;
                continue;
            }
            if (ch === '(') { variationDepth++; pos++; continue; }
            if (ch === ')') { variationDepth = Math.max(0, variationDepth - 1); pos++; continue; }
            if (/\s/.test(ch)) { pos++; continue; }
            var tokenEnd = pos;
            while (tokenEnd < len && !/[\s{}()]/.test(moveText[tokenEnd])) tokenEnd++;
            if (variationDepth === 0 && isMoveToken(moveText.slice(pos, tokenEnd))) plyCount++;
            pos = tokenEnd;
        }
        return null; // no mainline [P] marker found
    }

    // For a <pgn> game (not a bare <fen> diagram), the reader can switch
    // between the three ways ChessPublica can show a game. The library only
    // scans the DOM once on load, so switching can't re-render an element
    // in place — instead the chosen view is stashed and the page reloaded,
    // so the right tag exists before that scan runs. The stash is kept
    // (not cleared on read), so it survives every subsequent reload for
    // the rest of the tab's session — including the reload triggered by
    // switching a *different* block's view — until the reader picks a
    // different view for that same block. sessionStorage rather than
    // localStorage so it doesn't outlive the tab.
    //
    // One config entry per view (key/label/icon together) rather than three
    // parallel key->value maps: adding a fourth view used to mean touching
    // three separate objects that had to stay in sync by convention alone.
    // Icons are the same Lucide icons ChessPublica's own ribbon already
    // uses elsewhere (confirmed directly from its bundle's icon map —
    // "text-initial" for its own Article-view toggle, "play" for its Play
    // button, "search" for the magnifying glass), reused here so the
    // switcher reads as part of the same icon language instead of a
    // bespoke set.
    var pgnViews = [
        {
            key: 'pgn',
            label: 'Parti görünümü',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5h6"/><path d="M15 12h6"/><path d="M3 19h18"/><path d="m3 12 3.553-7.724a.5.5 0 0 1 .894 0L11 12"/><path d="M3.92 10h6.16"/></svg>'
        },
        {
            key: 'pgn-player',
            label: 'Oynatıcı görünümü',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg>'
        },
        {
            key: 'pgn-study',
            label: 'Çalışma görünümü',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>'
        }
    ];
    var pgnViewKeys = pgnViews.map(function (v) { return v.key; });
    var pgnBlockIndex = 0;
    // Every switcher-backed block's own storage key, in the order they're
    // found — the switcher click handler below walks this to revert any
    // *other* block currently on pgn-study back to its own default view,
    // so opening a second one doesn't leave two large panels open at
    // once. Built up as blocks are found, but only ever read from a click
    // handler, which can't fire until the reader's had the whole page
    // (and so this whole loop) to load first.
    var allStorageKeys = [];

    // Set below, for whichever block's storageKey matches pgnCenterPending,
    // to that block's own final tagName === 'pgn' — captured at that exact
    // moment because a puzzle block's own sessionStorage entry (see
    // isPuzzle handling below) gets deleted later in this very same pass,
    // before the pending-scroll check further down ever gets to read it
    // back. Reading sessionStorage.getItem(pgnCenterPending) again down
    // there used to silently see that deletion instead of the 'pgn' value
    // that was actually current when this block was built — a puzzle
    // switched to "Parti görünümü" reloaded onto a page whose own
    // scroll-restoration was already forced to manual and left at the
    // very top (see the window.scrollTo(0, 0) above), with nothing left
    // to correct it, since the pending-scroll block below never ran.
    var pgnCenterPendingIsPlainPgn = false;

    var paragraphs = Array.prototype.slice.call(body.querySelectorAll('p'));
    for (var i = 0; i < paragraphs.length; i++) {
        var p = paragraphs[i];
        if (!p.parentNode) continue;
        var lines = p.textContent.split('\n').map(function (s) { return s.trim(); }).filter(function (s) { return s.length; });
        if (!lines.length || !headerLineRe.test(lines[0])) continue;

        // Collect the leading run of "[Tag "value"]" header lines. Anything
        // left over on the same paragraph (no blank line before it) is
        // inline movetext, e.g. a puzzle's header immediately followed by
        // its solution on the next markdown line.
        var idx = 0;
        while (idx < lines.length && headerLineRe.test(lines[idx])) idx++;
        var headerLines = lines.slice(0, idx);
        var inlineMoveText = idx < lines.length ? lines.slice(idx).join(' ') : null;
        var hasFenTag = headerLines.some(function (l) { return fenTagRe.test(l); });

        var cropValue = null;
        headerLines = headerLines.filter(function (l) {
            var m = l.match(cropTagRe);
            if (!m) return true;
            cropValue = m[1].toLowerCase();
            return false;
        });

        var moveText = null;
        var next = null;
        if (inlineMoveText !== null) {
            if (movetextRe.test(inlineMoveText)) moveText = inlineMoveText;
        } else {
            next = p.nextElementSibling;
            if (next) {
                if (next.tagName === 'P') {
                    var t = next.textContent.trim();
                    if (movetextRe.test(t)) moveText = t;
                } else if (next.tagName === 'OL') {
                    // A movetext starting with "1. " is parsed by Markdown as
                    // an ordered list start; the "1. " marker itself gets
                    // consumed into list semantics and stripped from the
                    // <li> text, so we have to add it back to reconstruct
                    // valid PGN movetext.
                    var lis = Array.prototype.slice.call(next.querySelectorAll('li'));
                    if (lis.length) {
                        moveText = '1. ' + lis.map(function (li) { return li.textContent.trim(); }).join(' ');
                    }
                }
            }
        }

        // A header + movetext pair is a game (<pgn>) whether or not it
        // starts from a custom [FEN ...] position — PGN's SetUp/FEN tags
        // just say where move 1 (or move N, for an excerpt) begins, and
        // ChessPublica's <pgn> renders that natively. Auto-routing a FEN
        // header into <puzzle> instead used to happen here, but <puzzle>
        // renders as a bare, flipped diagram with no move list or comments
        // at all — verified against both a one-move example and a full
        // annotated excerpt, neither showed anything past the diagram — so
        // there's no working case left for it. A bare [FEN "..."] header
        // with no movetext is still a static diagram (<fen>).
        var tagName;
        if (moveText !== null) {
            tagName = 'pgn';
        } else if (hasFenTag) {
            tagName = 'fen';
        } else {
            continue;
        }

        var headerText = headerLines.join('\n');
        var storageKey = null;
        if (tagName === 'pgn') {
            // A [P]/[P n] marker turns the game into a puzzle the reader
            // must solve, which only makes sense in the interactive
            // <pgn-player> view (<pgn>'s move list would just print the
            // answer) — so a puzzle defaults to <pgn-player> instead of
            // <pgn>. That default still yields to a saved preference below:
            // the switcher's whole point is to let the reader override it,
            // and forcing <pgn-player> back every reload would make its
            // buttons look broken for exactly the blocks this exists for.
            var isPuzzle = puzzleMarkerRe.test(moveText);
            if (isPuzzle) tagName = 'pgn-player';
            storageKey = 'pgn-view:' + location.pathname + ':' + pgnBlockIndex;
            pgnBlockIndex++;
            allStorageKeys.push(storageKey);
            // Left in place (not removed after reading): switching another
            // block's view reloads the page too, and clearing this on read
            // would wipe out this block's remembered choice on that reload
            // even though the reader never touched this block.
            var savedView = sessionStorage.getItem(storageKey);
            if (pgnViewKeys.indexOf(savedView) !== -1) {
                tagName = savedView;
                // A puzzle's switch is honored for the reload it triggers
                // — proving the button works — but isn't remembered past
                // it: the whole point of defaulting a puzzle to
                // <pgn-player> is that it should still open there next
                // time, not stay on whatever view the reader last poked.
                if (isPuzzle) sessionStorage.removeItem(storageKey);
            }
            if (storageKey === pgnCenterPending) pgnCenterPendingIsPlainPgn = (tagName === 'pgn');
        }

        // "Find the best move for Black" is disorienting with the board
        // still drawn from White's side. ChessPublica already honors a
        // [Orientation "black"] header on <pgn-player> (it just doesn't
        // infer one from a puzzle position itself), so it's added here
        // when the puzzle the reader lands on first asks Black to move —
        // unless the header already states its own Orientation, which
        // wins over anything inferred here.
        if (tagName === 'pgn-player' && isPuzzle && !headerLines.some(function (l) { return orientationTagRe.test(l); })) {
            if (puzzleMoverColor(headerLines, moveText) === 'black') {
                headerText += '\n[Orientation "black"]';
            }
        }

        // ChessPublica reads a comment's own [P] / [P n] marker (n plies,
        // defaulting to 1) as "make this position a puzzle" — the reader
        // has to find the actual move themselves before the game
        // continues. Fine for a dedicated <puzzle>, but jarring in
        // <pgn-study>: a reader working through a whole annotated game
        // doesn't expect to be quizzed mid-read. Stripped before
        // ChessPublica ever sees it (same regex it uses itself, so the
        // comment text left behind reads exactly as it would if the
        // marker had been recognized and removed) rather than turning
        // puzzle mode off after the fact, which isn't exposed as an
        // option. <pgn>/<pgn-player> keep the marker, since only
        // <pgn-study>'s reading experience is the problem here.
        if (tagName === 'pgn-study' && moveText !== null) {
            moveText = moveText.replace(/\[P\s*\d*\]/g, '');
        }

        var el = document.createElement(tagName);
        el.textContent = moveText !== null ? (headerText + '\n\n' + moveText) : headerText;
        // pgn-study-enhance.js's own centering (see pgnCenterPending above)
        // needs to find *this specific* block's <pgn-study> once it's
        // ready — attributes set before a custom element upgrades survive
        // the upgrade, so this is still readable from there later.
        if (storageKey) el.setAttribute('data-pgn-block-key', storageKey);

        // Only a bare diagram is cropped, never a game: <pgn>/<pgn-player>/
        // <pgn-study> stay interactive (move list, replay), and chopping
        // half their board off would just make that unusable.
        var insertNode = el;
        if (cropValue && tagName === 'fen') {
            var cropWrap = document.createElement('div');
            cropWrap.className = 'board-crop board-crop--' + cropValue;
            cropWrap.appendChild(el);
            insertNode = cropWrap;
        }

        if (storageKey) {
            var wrap = document.createElement('div');
            wrap.className = 'pgn-switcher-block';
            // Also carried by el itself (see data-pgn-block-key above),
            // which is enough for pgn-study-enhance.js's own centering:
            // that only ever targets a <pgn-study>, and ChessPublica
            // never replaces that tag, just upgrades it in place. A
            // <pgn> is different — ChessPublica fully replaces it with
            // its own rendered markup once processed, discarding
            // whatever attributes were on the original tag — so the
            // *wrapper*, which ChessPublica never touches, needs its own
            // copy for the pgn-view centering below to still be able to
            // find this block after that swap.
            wrap.setAttribute('data-pgn-block-key', storageKey);
            var switcher = document.createElement('div');
            switcher.className = 'pgn-switcher';
            switcher.setAttribute('role', 'group');
            switcher.setAttribute('aria-label', 'Görünüm seç');
            pgnViews.forEach(function (view) {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'pgn-switcher-btn' + (view.key === tagName ? ' is-active' : '');
                btn.setAttribute('data-view', view.key);
                btn.setAttribute('aria-pressed', view.key === tagName ? 'true' : 'false');
                btn.title = view.label;
                btn.setAttribute('aria-label', view.label);
                btn.innerHTML = view.icon;
                btn.addEventListener('click', (function (key, chosenView) {
                    return function () {
                        if (chosenView === 'pgn-study') {
                            // Revert every *other* block currently on
                            // pgn-study back to its own default — removing
                            // the key rather than forcing it to 'pgn'
                            // specifically matters for a puzzle block (see
                            // isPuzzle above): its default is 'pgn-player',
                            // not 'pgn', and 'pgn' would print its answer
                            // straight into the move list.
                            allStorageKeys.forEach(function (otherKey) {
                                if (otherKey !== key && sessionStorage.getItem(otherKey) === 'pgn-study') {
                                    sessionStorage.removeItem(otherKey);
                                }
                            });
                        }
                        // Switching to/from pgn-study's own tall panel
                        // isn't the only way this block's height (and so
                        // everything below it) changes on reload — going
                        // back to plain 'pgn' from either pgn-study or
                        // pgn-player collapses it just as much, and a
                        // plain reload's native scroll restoration
                        // doesn't account for that either. 'pgn-study'
                        // is handled by pgn-study-enhance.js's own
                        // centering once its <pgn-study> reports
                        // cp-ready; 'pgn' is handled below, once this
                        // script finds ChessPublica has replaced it.
                        if (chosenView === 'pgn-study' || chosenView === 'pgn') {
                            sessionStorage.setItem('pgn-center-pending', key);
                            history.scrollRestoration = 'manual';
                        }
                        sessionStorage.setItem(key, chosenView);
                        location.reload();
                    };
                })(storageKey, view.key));
                switcher.appendChild(btn);
            });
            wrap.appendChild(switcher);
            wrap.appendChild(insertNode);
            p.parentNode.insertBefore(wrap, p);
        } else {
            p.parentNode.insertBefore(insertNode, p);
        }
        p.remove();
        if (next) next.remove();
    }

    // pgn-study-enhance.js's own centering only ever matches a
    // <pgn-study> by data-pgn-block-key, and only runs at all when the
    // page still has at least one <pgn-study> left on it (its own guard
    // returns immediately otherwise) — neither holds once the reader has
    // switched *to* plain 'pgn': ChessPublica replaces a <pgn> element
    // with its own rendered markup once it processes it, discarding
    // whatever attributes were on the original tag (confirmed directly:
    // no data-pgn-block-key, not even a <pgn> tag, survives in the DOM
    // afterward), and the page may have no other pgn-study block left at
    // all. .pgn-switcher-block, the wrapper this file creates and
    // ChessPublica never touches, is what actually persists, so the key
    // was also stamped there above — read back here instead.
    if (pgnCenterPendingIsPlainPgn) {
        var pendingWrap = document.querySelector('.pgn-switcher-block[data-pgn-block-key="' + pgnCenterPending + '"]');
        if (pendingWrap) scrollPgnBlockIntoViewWhenReady(pendingWrap);
    }

    // ChessPublica processes a freshly-inserted <pgn> reactively — a
    // MutationObserver, not a synchronous scan (confirmed directly: it
    // still gets replaced correctly even though this script builds it
    // after ChessPublica's own script has already finished running) —
    // and never dispatches a 'cp-ready' event for it the way it does for
    // <pgn-player>/<pgn-study> (confirmed directly: nothing ever fires),
    // so there's no readiness signal to wait for here the way
    // pgn-study-enhance.js's own centering waits for cp-ready. A single
    // requestAnimationFrame isn't enough of a wait either — confirmed
    // directly: wrap still held the raw, unprocessed <pgn> element (no
    // .pgn-container child yet) a full frame later, so measuring its own
    // top against it there read the wrong, pre-render position.
    //
    // .pgn-container's first appearance isn't "done" either, only
    // "started" — confirmed directly (instrumented every MutationObserver
    // on the page): for a long, heavily-annotated game ChessPublica keeps
    // appending move text and inline diagrams in many more batches well
    // after that first one, one game logging past 900 further mutations
    // after .pgn-container already existed. Disconnecting and measuring
    // right then, as an earlier version did, read the block's height
    // before it had finished growing, computed the scroll target off
    // that too-short number, and left the reader stranded above the
    // block's real, final position — its title scrolled just out of
    // view above the fold, looking like a scroll to nowhere. Waiting for
    // a quiet stretch with no further mutations — not just the first
    // sighting of .pgn-container — is what actually means the block is
    // done growing. A 5s cap forces things along regardless in case
    // mutations never quiet down for some reason (scrolling to whatever
    // rendered beats never scrolling at all). Waiting for any diagram
    // images inside it after that mirrors pgn-study-enhance.js's own
    // centering, which waits for a study's board pieces the same way —
    // kept separate rather than shared from there, since that file
    // doesn't run at all in the no-pgn-study-left case this exists for.
    function scrollPgnBlockIntoViewWhenReady(wrap) {
        var finalized = false;
        var settleTimer = null;

        function finalizeContent() {
            if (finalized) return;
            finalized = true;
            clearTimeout(settleTimer);
            clearTimeout(maxWaitTimer);
            contentObserver.disconnect();
            waitForImagesThenScroll();
        }
        function finalizeIfSettled() {
            if (wrap.querySelector('.pgn-container')) finalizeContent();
        }

        var maxWaitTimer = setTimeout(finalizeContent, 5000);
        var contentObserver = new MutationObserver(function () {
            clearTimeout(settleTimer);
            settleTimer = setTimeout(finalizeIfSettled, 300);
        });
        contentObserver.observe(wrap, { childList: true, subtree: true });
        settleTimer = setTimeout(finalizeIfSettled, 300);

        function waitForImagesThenScroll() {
            var images = Array.prototype.slice.call(wrap.querySelectorAll('img'));
            var remaining = images.length;
            var scrolled = false;
            function scrollToTop() {
                if (scrolled) return;
                scrolled = true;
                var rect = wrap.getBoundingClientRect();
                // Aligned to the block's own top (plus a small resting
                // margin), not centered on its overall middle the way
                // pgn-study-enhance.js's own doCenter centers a
                // pgn-study panel — confirmed directly, centering here
                // instead landed the reader mid-scroll through some
                // unrelated comment several screens into the game's own
                // full movetext, with the title and switcher buttons
                // they just clicked scrolled off above. Centering makes
                // sense for pgn-study/pgn-player: both are a
                // fixed-height interactive panel (board + a bounded
                // ribbon), so the panel's own middle is close to where
                // the reader's attention already is. A plain <pgn> (this
                // post's "parti görünümü") is just flowing article text
                // with no such bound — a full annotated game can run
                // thousands of pixels tall, so centering its overall
                // midpoint can land anywhere in that text instead of
                // where the reader actually asked to be sent: the top of
                // the block they just switched to.
                var target = Math.max(0, rect.top + window.scrollY - 16);
                // Same one-second reassertion pgn-study-enhance.js's own
                // doCenter uses, for the same reason (see its own
                // comment): a single scrollTo isn't reliable against
                // whatever occasionally nudges the page back afterward,
                // and backing off the moment the reader actually scrolls
                // themselves is what keeps this from fighting them.
                var deadline = Date.now() + 1000;
                var interrupted = false;
                function markInterrupted() { interrupted = true; }
                window.addEventListener('wheel', markInterrupted, { passive: true, once: true });
                window.addEventListener('touchmove', markInterrupted, { passive: true, once: true });
                window.addEventListener('keydown', markInterrupted, { once: true });
                (function reassert() {
                    if (interrupted) return;
                    window.scrollTo(0, target);
                    if (Date.now() < deadline) requestAnimationFrame(reassert);
                })();
                sessionStorage.removeItem('pgn-center-pending');
                history.scrollRestoration = 'auto';
            }
            if (remaining === 0) {
                scrollToTop();
                return;
            }
            var fallback = setTimeout(scrollToTop, 3000);
            images.forEach(function (img) {
                var settled = false;
                function onSettled() {
                    if (settled) return;
                    settled = true;
                    remaining--;
                    if (remaining <= 0) {
                        clearTimeout(fallback);
                        scrollToTop();
                    }
                }
                img.addEventListener('load', onSettled, { once: true });
                img.addEventListener('error', onSettled, { once: true });
                if (img.complete) onSettled();
            });
        }
    }

    // Signals that every [Tag "..."] header block on this page has been
    // replaced by its real <pgn>/<fen>/... element. site.css's
    // curly-quote pass (assets/js/curly-quotes.js) depends on those tags
    // already existing so it knows what PGN/FEN text to leave untouched —
    // converting a straight quote inside literal, still-unconverted PGN
    // header text would corrupt it. Both scripts happen to load in a fixed
    // order today (this one first, finishing before curly-quotes.js is
    // even fetched), so the event itself will always have already fired
    // by the time curly-quotes.js goes looking for it — a plain
    // addEventListener there would wait forever for an event that already
    // happened. The flag lets it check "did this already happen?" first;
    // the event stays too, as the correct answer if that order is ever
    // reversed.
    window.satranckahvesiPgnTagsReady = true;
    document.dispatchEvent(new CustomEvent('satranckahvesi:pgn-tags-ready'));
})();

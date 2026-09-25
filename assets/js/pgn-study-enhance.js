(function () {
    // pgn-study's two desktop columns are sized by its own CSS as
    // var(--left-col-width) 6px var(--right-col-width) — ChessPublica's
    // own default for those two custom properties reads as a
    // roughly-even split in practice, not the 1fr/2fr (move list wider
    // than the board) this site wants, so they're set explicitly once
    // here, at "cp-ready". Only the custom properties are touched, never
    // grid-template-columns itself: an earlier version of this script set
    // that whole property directly, as a hardcoded literal — a plain
    // value, not a var() reference, so it silently froze the split
    // forever and made the drag splitter stop doing anything visible.
    // Setting only the custom properties leaves the stylesheet's own
    // var()-based rule in charge, so it keeps reacting normally to
    // whatever sets those properties next, including a drag.
    //
    // The same "cp-ready" signal is also the first point at which the
    // ribbon's buttons exist, so it's reused here to prune/relabel them.
    // ChessPublica doesn't expose stable class names or data attributes for
    // individual ribbon buttons that we could target directly, so buttons
    // are matched by their own accessible name (title/aria-label) instead —
    // the same text a reader sees on hover, in whatever language
    // ChessPublica renders it.
    //
    // Collapsing is disabled outright, not just by removing its button:
    // ChessPublica's own CSS shows a collapsed pgn-study is click-to-expand
    // (cursor: pointer on the whole panel), meaning something besides the
    // button we remove can still toggle the "pgn-study-collapsed" class.
    // Rather than guess at every trigger, the observer below keeps running
    // for the life of the page and strips that class the instant it's
    // added, so the panel can never actually end up collapsed.
    // Prev/next buttons live in the ribbon itself, at the front (Play and
    // its speed control are gone — see onReady below), styled as
    // .pgn-study-ribbon-btn like ChessPublica's own Settings so they blend
    // in rather than looking like a separate, bolted-on control (our own
    // .pgn-switcher-btn look would clash with the ribbon's actual
    // transparent/no-border style). Clicking a .pgn-move to jump to it
    // (a confirmed, real interaction) was tried first, but has no
    // equivalent element for "before the first move" — there's no
    // .pgn-move for the starting position, so going back from move 1
    // always failed. ChessPublica's own left/right arrow-key shortcuts
    // call goTo(index ± 1) directly, and goTo clamps to 0 (the starting
    // position, before any move) instead of failing, so the buttons
    // dispatch those same ArrowLeft/ArrowRight keydown events on
    // document instead — the exact mechanism ChessPublica's own keyboard
    // shortcut uses, inherits its correct start/end clamping for free.
    var pgnStudyNavButtons = [
        {
            dir: 'prev',
            label: 'Bir hamle geri',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 6 9 12 15 18"/></svg>'
        },
        {
            dir: 'next',
            label: 'Bir hamle ileri',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>'
        }
    ];

    var studies = Array.prototype.slice.call(document.querySelectorAll('.post-body pgn-study'));
    if (!studies.length) return;

    // Set by pgn-detect.js's switcher right before the reload that follows
    // opening a pgn-study — this page's own way of saying which block
    // should end up centered once its <pgn-study> is ready (see
    // centerIfPending below, and pgn-detect.js's own top for why
    // scrollRestoration is already off by this point).
    var pgnCenterPending = sessionStorage.getItem('pgn-center-pending');

    // Which study a page-wide ArrowLeft/ArrowRight keypress should act on.
    // Defaults to the first (and, on the overwhelming majority of posts,
    // only) study so keyboard nav works immediately without requiring a
    // hover first; updated below whenever a study is actually
    // hovered/clicked/touched, mirroring how ChessPublica itself decides
    // which pgn-study/pgn-player last received a click/hover/touch.
    var activeStudy = studies[0];
    studies.forEach(function (study) {
        function markActive() { activeStudy = study; }
        study.addEventListener('mouseenter', markActive);
        study.addEventListener('click', markActive);
        study.addEventListener('touchstart', markActive, { passive: true });
    });

    // ChessPublica's own document-level keydown listener silently no-ops
    // for ArrowRight/ArrowLeft whenever the engine's own .player-container
    // isn't at least partially inside the viewport (confirmed directly in
    // its bundle: it reads the container's own getBoundingClientRect and
    // bails if top/bottom don't straddle the visible window before doing
    // anything else) — exactly the state a reader can land in right after
    // switching a block to pgn-study: centerIfPending's own doCenter()
    // computes its one-time scroll target from a single rect measurement
    // and only re-asserts that same frozen value for one second before
    // giving up for good (see its own comment on why), so any further
    // page-height shift after that — a later image elsewhere on a long,
    // image-heavy post finishing its own load, say — can leave the
    // container stale and out of view by the time the reader actually
    // tries to step through the game, with nothing left to correct it.
    // Confirmed directly: with the container left short of the viewport
    // like that, neither a real ArrowRight press nor the ribbon's own next
    // button (which just simulates one, see navigate() below) advances a
    // single ply. scrollIntoView's own 'nearest' block value is a no-op
    // whenever the container is already visible, so calling this on every
    // navigation attempt costs nothing the overwhelming majority of the
    // time — it only ever does something the one time it's actually
    // needed, and does it synchronously, so the geometry ChessPublica's
    // own listener reads right after already reflects the corrected
    // scroll position instead of the stale one.
    function ensureContainerInView(targetStudy) {
        var container = targetStudy && targetStudy.querySelector('.player-container');
        if (container) container.scrollIntoView({ block: 'nearest' });
    }

    // A real ArrowLeft/ArrowRight press already reaches ChessPublica's own
    // keydown handler directly (it's listening on document too), which is
    // exactly right outside a branch point — nothing to add there. At a
    // branch point, ChessPublica shows a .pgn-study-move-picker instead of
    // just advancing — its own goTo() is wrapped to refuse a plain "next"
    // step there (confirmed directly in its bundle: calling goTo(index + 1)
    // at that exact index resets right back to index and pauses, rather
    // than moving), until the reader picks a row. Its own mainline row is
    // what actually continues past it — its click handler is the one thing
    // that flips the internal flag goTo's guard checks, which nothing
    // outside the bundle can set directly. Clicking it ourselves (via
    // resolveBranch, defined per-study below) reproduces exactly what a
    // reader clicking it would have done back when it was still visible;
    // a plain ArrowRight dispatch would otherwise silently do nothing at
    // a branch point.
    //
    // Registered once, page-wide, rather than once per study as an earlier
    // version did: that version's copy of this same handler checked its own
    // study's branch-point state unconditionally on every keypress, so a
    // single ArrowRight with two studies both sitting at a branch point
    // would advance *both* instead of just the one the reader was actually
    // looking at. Gating on activeStudy fixes that and also means only one
    // listener exists regardless of how many studies the page has.
    document.addEventListener('keydown', function (e) {
        if (!e.isTrusted) return;
        var active = document.activeElement;
        var tag = active && active.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (active && active.isContentEditable)) return;
        if (e.code === 'Space') {
            // ChessPublica binds Space to togglePlay() itself, straight
            // from each player's own setup code — there's no button behind
            // it we could have removed above, since it never routes
            // through the ribbon at all. That listener is also registered
            // on document, added once a player's ready, which is always
            // after this one (registered synchronously as soon as this
            // script runs) — so, same ordering the ArrowRight case below
            // already relies on, this one sees Space first every time.
            // stopImmediatePropagation alone (no preventDefault) keeps
            // that handler from ever running — and so from calling its own
            // preventDefault — without touching the page's normal
            // space-to-scroll behavior, which is otherwise untouched by
            // removing Play.
            e.stopImmediatePropagation();
            return;
        }
        var dir = e.code === 'ArrowRight' ? 'next' : e.code === 'ArrowLeft' ? 'prev' : null;
        if (!dir) return;
        ensureContainerInView(activeStudy);
        if (dir === 'next' && activeStudy.resolveBranch && activeStudy.resolveBranch()) {
            // Without this, the keydown still reaches ChessPublica's own
            // keydown listener right after — it's on the same document
            // node ours is, so a plain stopPropagation() doesn't stop it
            // (that only blocks propagation to *other* nodes; a sibling
            // listener on the identical node still fires unless it's
            // stopImmediatePropagation specifically). Resolving the branch
            // via the mainline row's own click already advances one ply,
            // so that second handler saw a position no longer at a branch
            // point and advanced a *second* ply on the very same keypress
            // (confirmed directly: one ArrowRight at a branch point played
            // both the picked mainline move and the reply after it).
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    });

    // The board itself carries two separate click listeners of
    // ChessPublica's own, confirmed directly in its bundle: one on
    // boardEl straight to togglePlay(), and a second, independent one (in
    // the same function, Hn, that also carries the ArrowRight/ArrowLeft
    // keydown handler this file's own synthetic dispatches rely on, so
    // that whole listener set can't just be torn down) that reads any
    // click landing within 300ms of a previous one on the same board as a
    // double-click and jumps ±10 plies — left half for -10, right half
    // for +10, a video-scrubber-style "skip 10" gesture. A reader's own
    // plain double-click, nowhere near any move ten plies away, lands
    // there anyway, reading as a jump to an arbitrary, unrelated
    // position.
    //
    // Neither listener does anything a reader should still be able to
    // reach from the board itself: puzzle mode — the one case a board
    // click is actually meant to do something — never turns on inside
    // pgn-study in the first place (pgn-detect.js strips a [P] marker
    // before ChessPublica ever sees pgn-study's own movetext, precisely
    // because pgn-study's reading experience doesn't want it; see that
    // file's own comment). So every click landing on the board is simply
    // stopped here before either listener sees it, rather than trying to
    // replicate Hn's own 300ms same-board timing check to single out
    // only the second click of a pair: an earlier version that did
    // turned out flaky under repeated testing (occasionally leaving next/
    // prev unresponsive afterward, seemingly tied to pause() actually
    // running on that second click) for reasons that didn't fully turn
    // up even with the bundle in hand — not a risk worth carrying for a
    // click this file has no legitimate use for anyway.
    //
    // Capture phase on document, rather than another listener on the
    // board itself, is what makes this reliable regardless of script
    // load order: a capture-phase listener on an ancestor always runs
    // before a bubble-phase one on a descendant, by spec, so this is
    // guaranteed to see the click before either of ChessPublica's own
    // board listeners do, unlike matching their registration order by
    // chance (the ArrowRight case above only works because this script
    // happens to run first).
    document.addEventListener('click', function (e) {
        if (e.target.closest && e.target.closest('.post-body pgn-study .board-wrap')) {
            e.stopImmediatePropagation();
        }
    }, true);

    studies.forEach(function (study) {
        var readyHandled = false;
        var lastMirroredSource = null;
        function onReady() {
            study.style.setProperty('--left-col-width', '1fr');
            study.style.setProperty('--right-col-width', '2fr');

            // Removing the ribbon's own Play button (below) and blocking
            // Space (see the page-wide keydown handler above) still isn't
            // "no autoplay": ChessPublica's base engine binds a *board*
            // click straight to togglePlay() too, in its own setup code,
            // entirely independent of both of those — confirmed directly
            // in its bundle: `this.boardEl.addEventListener("click", p =>
            // {... this.togglePlay(!0)}, {signal:a})`. play() itself is
            // also what the mainline picker row's own confirm handler
            // calls to step past a branch (confirmed directly:
            // `()=>{X=true,b.play()}`) — resolveBranch() below already
            // has to undo the state.playing:true that leaves behind — so
            // play() itself can't just be replaced outright; a first
            // version that did broke branch resolution entirely (confirmed
            // directly: clicking the mainline row stopped advancing past
            // it at all).
            //
            // play()'s own body does two separate things: a one-time
            // step (state.index++, goTo) — the part resolveBranch()
            // depends on — and, as its last line, starting the actual
            // continuous ticking loop via this._loopRAF(). Overriding
            // just _loopRAF() to a no-op leaves the one-time step alone
            // but means that loop can never actually start, from any
            // caller, so nothing plays on. this._loopRAF is also called
            // from exactly one place in ChessPublica's own bundle — the
            // last line of play() itself — so nothing else depends on it
            // doing anything.
            //
            // This still doesn't chase every trigger one at a time the
            // way blocking Space does — the board click above wasn't
            // known about until a reader found it, and there could be
            // others — every path that could ever start the loop still
            // resolves the same instance's own ._loopRAF at call time
            // (.bind() in ChessPublica's own wrappers only fixes `this`,
            // not which method a later `this._loopRAF()` looks up), so
            // this covers all of them regardless. Scoped to this study's
            // own internal <pgn-player> only: a standalone <pgn-player>
            // block (not inside a pgn-study) keeps its own working Play
            // button and real autoplay, since removing play/pause was
            // only ever asked for inside pgn-study.
            var innerPlayerForPlay = study.querySelector('pgn-player');
            var innerEngineForPlay = innerPlayerForPlay && innerPlayerForPlay._engine;
            if (innerEngineForPlay) innerEngineForPlay._loopRAF = function () {};

            var buttons = Array.prototype.slice.call(study.querySelectorAll('.pgn-study-ribbon-btn'));
            buttons.forEach(function (btn) {
                var label = (btn.getAttribute('aria-label') || btn.getAttribute('title') || btn.textContent || '').trim();
                // .pgn-study-article-btn is the mobile-only board/article-view
                // toggle — redundant now that the board stays visible and the
                // active comment is mirrored automatically below it, so it's
                // removed by class rather than guessed-at label text. Play and
                // its speed control go the same way: moves are next/prev
                // button or arrow-key only now, no autoplay to start or pace
                // (see resolveBranch's own comment for why removing it turned
                // out to be far more robust than pacing it against a picker
                // ChessPublica itself refuses to advance past on a timer).
                if (btn.classList.contains('pgn-study-article-btn') || /table.*of.*contents|\btoc\b/i.test(label) || /collapse|expand/i.test(label) || /^play\b/i.test(label) || /speed/i.test(label)) {
                    btn.remove();
                } else if (/setting/i.test(label)) {
                    btn.setAttribute('aria-label', 'Ayarlar');
                    btn.title = 'Ayarlar';
                }
            });

            var ribbon = study.querySelector('.pgn-study-ribbon');
            if (ribbon && !study.querySelector('[data-pgn-nav]')) {
                function navigate(dir) {
                    // If the reader is currently sitting at an unresolved
                    // branch point — reached by a direct move-list click
                    // rather than stepping into it (see resolveBranch's own
                    // comment on why those two are treated differently) —
                    // "next" has to resolve it first: resolveBranch() forces
                    // that regardless of how we got here, and its own click
                    // on the mainline row already *is* the single forward
                    // step this call is for, so nothing else needs to run
                    // afterward.
                    if (dir === 'next' && resolveBranch()) return;
                    // See ensureContainerInView's own comment, above: the
                    // synthetic keydown below is silently ignored by
                    // ChessPublica's own listener under the exact same
                    // out-of-view condition a real press is.
                    ensureContainerInView(study);
                    // ChessPublica's own document-level keydown listener acts
                    // on whichever pgn-study/pgn-player it last saw a
                    // hover/click/touch on — dispatching a real mouseenter on
                    // this study first (our button click alone never bubbles
                    // one to it) makes sure that's this study, not whichever
                    // one the reader last actually touched.
                    study.dispatchEvent(new MouseEvent('mouseenter'));
                    document.dispatchEvent(new KeyboardEvent('keydown', {
                        code: dir === 'next' ? 'ArrowRight' : 'ArrowLeft',
                        bubbles: true
                    }));
                }

                // Inserted into .pgn-study-ribbon-left — Play used to live
                // there (its own always-visible left-hand group, part of
                // .pgn-study-ribbon-toprow, distinct from the title in the
                // middle and Download/Flip/Settings on the right), so that
                // was also where its own "insert right after Play" anchor
                // pointed. With Play gone the group is empty, but it's
                // still the right home for these: confirmed directly, the
                // *other* remaining buttons (Download, Flip) don't live in
                // that always-visible row at all — they're tucked inside
                // .pgn-study-settings-inline, a panel this width keeps
                // display: none until the reader opens Settings, so an
                // earlier version anchoring off "whichever
                // .pgn-study-ribbon-btn happens to come first in the whole
                // ribbon" silently inserted prev/next into that same
                // hidden panel instead.
                var leftGroup = study.querySelector('.pgn-study-ribbon-left') || ribbon;
                pgnStudyNavButtons.forEach(function (nav) {
                    var btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'pgn-study-ribbon-btn';
                    btn.setAttribute('data-pgn-nav', nav.dir);
                    btn.setAttribute('aria-label', nav.label);
                    btn.title = nav.label;
                    btn.innerHTML = nav.icon;
                    btn.addEventListener('click', function () {
                        navigate(nav.dir);
                    });
                    leftGroup.appendChild(btn);
                });
            }

            // A move that starts a branch point (the reader is sitting
            // right before it, at the exact index a picker is already
            // showing choices for) can only actually be entered through
            // .pgn-study-picker-row.mainline's own click handler — the
            // same guard resolveBranch already works around for "next"
            // above. Clicking that move's own .pgn-move span directly
            // instead — its data-ply equal to the engine's current index,
            // i.e. this move IS the very choice the picker is showing for
            // — does nothing on its own (confirmed directly: ChessPublica's
            // own click-to-jump treats "target ply equals current index" as
            // already-there, a no-op, even though the position is only
            // reachable by committing to this specific choice). Every
            // other move click — before this exact position, well past it,
            // or landing past it via a fresh multi-ply jump (data-ply ends
            // up one *less* than the resulting index, since a .pgn-move's
            // data-ply is its 0-indexed position, not the index reached
            // once it's played) — already works without this, so it only
            // needs to step in for that one narrow case.
            var moveList = study.querySelector('.pgn-container');
            var innerPlayerForClicks = study.querySelector('pgn-player');
            if (moveList && innerPlayerForClicks) {
                moveList.addEventListener('click', function (e) {
                    var moveEl = e.target.closest('.pgn-move[data-ply]');
                    if (!moveEl) return;
                    var engine = innerPlayerForClicks._engine;
                    if (!engine || !engine.state) return;
                    if (parseInt(moveEl.getAttribute('data-ply'), 10) !== engine.state.index) return;
                    resolveBranch();
                });
            }

            if (!study.querySelector('.pgn-study-mobile-comment') && study.querySelector('pgn-player')) {
                // Appended at the true end of pgn-study's children, after
                // <pgn-player>, its resizer and .pgn-container alike. On
                // desktop, pgn-study is display: grid with an explicit
                // three-column template (board / 6px resizer / move list),
                // and those three existing children fill it via plain
                // auto-placement (confirmed directly: no explicit
                // grid-column on any of them in ChessPublica's CSS).
                // Wedging a new, unpositioned sibling between two of them
                // throws that auto-placement off entirely (verified: the
                // next auto-placed item then restarts at column 1 instead
                // of continuing into its intended column, corrupting the
                // whole layout). Appending after all three leaves their
                // mutual placement untouched.
                var commentDisplay = document.createElement('div');
                commentDisplay.className = 'pgn-study-mobile-comment';
                study.appendChild(commentDisplay);
                syncActiveComment();
            }

            // ChessPublica's own document-level keydown listener only
            // acts on whichever pgn-study/pgn-player it last saw a
            // hover/click/touch on (see this file's own page-wide
            // keydown handler and navigate()'s own comment on it,
            // above) — confirmed directly: right after this panel first
            // becomes ready, nothing has touched it yet, so a reader's
            // very first real ArrowRight press (with no prior click or
            // hover of their own) does nothing at all, even though the
            // ribbon's own next/prev buttons already work on the very
            // first click — they dispatch this same synthetic
            // mouseenter themselves before simulating the key press
            // (see navigate() above), which a real keypress never gets
            // the chance to do on its own. Firing it here once, as soon
            // as the panel is actually ready to be stepped through,
            // establishes that "last touched" state proactively so the
            // keyboard already works on the reader's first real press —
            // most noticeably right after switching a block to
            // pgn-study, when its <pgn-study> is brand new and nothing
            // has touched it yet.
            study.dispatchEvent(new MouseEvent('mouseenter'));
            activeStudy = study;

            centerIfPending();
        }
        // Only true for the one block pgn-detect.js's switcher just sent
        // the reader here to see (see pgnCenterPending above) — every
        // other study's own data-pgn-block-key won't match, so this is a
        // no-op for them. Run at the very end of onReady(), once the
        // panel's own layout (ribbon, nav buttons, board) is in place —
        // but the board's own piece images are still loading at that
        // point (confirmed directly: 24-40 of a board's ~58 <img>s still
        // incomplete right as cp-ready appears), each one arriving with
        // its own real size and nudging the panel's height as it does.
        // Centering against the panel's height *now* uses a still-settling
        // number, and the browser's own scroll anchoring then "corrects"
        // the scroll position to compensate as each image keeps landing —
        // confirmed directly: with nothing waiting for them, the centered
        // position drifted back down to 0 anywhere from under a second to
        // a couple of seconds later, only sometimes caught by a fixed
        // wait in testing (which is what made this look like a race in
        // the click handling itself before this was traced here). Waiting
        // for every one of this study's own images to finish first — load
        // or error, either settles its slot in the layout — means the
        // rect this reads is the panel's real, final height.
        function centerIfPending() {
            if (!pgnCenterPending || study.getAttribute('data-pgn-block-key') !== pgnCenterPending) return;
            pgnCenterPending = null;
            var images = Array.prototype.slice.call(study.querySelectorAll('img'));
            var remaining = images.length;
            var centered = false;
            if (remaining === 0) {
                doCenter();
                return;
            }
            // A fallback in case some image never settles (a genuinely
            // dropped network request, say): centering late off a still-
            // incomplete board beats never centering at all.
            var fallback = setTimeout(doCenter, 3000);
            images.forEach(function (img) {
                var settled = false;
                function onSettled() {
                    if (settled) return;
                    settled = true;
                    remaining--;
                    if (remaining <= 0) doCenter();
                }
                img.addEventListener('load', onSettled, { once: true });
                img.addEventListener('error', onSettled, { once: true });
                // The image can finish loading in the gap between this
                // study's own .complete check further up and this
                // listener actually attaching — checked again here, after
                // attaching, so that race can't leave onSettled waiting
                // on a load/error event that already fired without it.
                if (img.complete) onSettled();
            });
            function doCenter() {
                if (centered) return;
                centered = true;
                clearTimeout(fallback);
                var rect = study.getBoundingClientRect();
                var elementCenter = rect.top + window.scrollY + rect.height / 2;
                var target = Math.max(0, elementCenter - window.innerHeight / 2);
                // A single scrollTo call here isn't reliable on its own —
                // confirmed directly: something (never caught red-handed
                // despite patching every scroll-adjacent API — scrollTo,
                // scrollBy, scrollIntoView, focus, even the scrollTop
                // setter directly, all with zero hits, and overflow-anchor
                // set to none had no effect either) sometimes nudges the
                // page back to the top within a single animation frame of
                // this call succeeding, and sometimes as much as a second
                // later, unpredictably. Reasserting the same target on
                // every frame for a second is a blunt fix for a mechanism
                // that's still unidentified, but it reliably wins — this
                // file's own onReady() only runs once per study, so a
                // second's worth of re-assertion is a small, one-time
                // cost. Backing off the moment the reader actually
                // touches a scroll input (wheel, touch-drag, or any key)
                // is what keeps this from fighting a reader who scrolls
                // away on their own right after landing here.
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
                // Back to normal so a later, unrelated refresh of this
                // same page still restores the reader's own scroll
                // position instead of always reopening at the top (see
                // pgn-detect.js's own top for why this was turned off in
                // the first place).
                history.scrollRestoration = 'auto';
            }
        }
        function stripCollapsed() {
            if (study.classList.contains('pgn-study-collapsed')) {
                study.classList.remove('pgn-study-collapsed');
            }
        }
        // ChessPublica inserts the variation picker somewhere in this same
        // subtree too, whenever a branch point comes up during navigation
        // — after the comment display already exists, and regardless of
        // exactly where. Keeping it pinned as the very last child on every
        // mutation (instead of only once) means however the picker gets
        // inserted, it always ends up pushed above it rather than after.
        function keepLayoutOrder() {
            var commentDisplay = study.querySelector('.pgn-study-mobile-comment');
            if (!commentDisplay) return;
            if (study.lastElementChild !== commentDisplay) {
                study.appendChild(commentDisplay);
            }
        }
        // .pgn-container (the full move list, with comments interleaved in
        // the move text) stays hidden on mobile; instead this mirrors just
        // the currently active comment's own content into the dedicated
        // display next to the nav buttons, updating live as the reader
        // steps through moves (each step toggles which comment carries
        // .pgn-comment-active, which this same observer already watches
        // for via subtree: true).
        function syncActiveComment() {
            var commentDisplay = study.querySelector('.pgn-study-mobile-comment');
            if (!commentDisplay) return;
            var active = study.querySelector('.pgn-comment.pgn-comment-active, .pgn-comment-inline.pgn-comment-active');
            // Only a variation's own first move carries a comment of its
            // own — every step after it has none, so without this check
            // this would blank the display right after that first step,
            // even though the reader is still inside the very same
            // variation (confirmed directly: engine._variation on the
            // study's internal <pgn-player> stays truthy the whole time
            // they're in it, only going false once they leave it back to
            // the mainline). Leaving whatever was last mirrored in place
            // while that holds keeps the variation's text under the board
            // for as long as they're still in it; the moment they leave,
            // this same function runs again for the mainline position
            // that follows and clears/updates normally.
            if (!active) {
                var innerPlayer = study.querySelector('pgn-player');
                var engine = innerPlayer && innerPlayer._engine;
                if (engine && engine._variation) return;
            }
            // Identity check rather than a content diff: this re-runs on
            // every DOM mutation the observer below sees, most of which
            // have nothing to do with which comment is active, and the
            // same element doesn't change its own content while active —
            // only which element carries .pgn-comment-active changes.
            if (active === lastMirroredSource) return;
            lastMirroredSource = active || null;

            while (commentDisplay.firstChild) commentDisplay.removeChild(commentDisplay.firstChild);
            if (active) {
                // Cloned node-to-node rather than round-tripped through an
                // HTML string (a previous version did
                // commentDisplay.innerHTML = active.innerHTML): this
                // content originates from a PGN comment ChessPublica
                // itself rendered from an author's PGN text, and today's
                // authors are trusted, but there's no reason to route
                // already-parsed markup back through the HTML parser a
                // second time when the DOM nodes themselves can just be
                // copied directly.
                Array.prototype.slice.call(active.childNodes).forEach(function (child) {
                    commentDisplay.appendChild(child.cloneNode(true));
                });
            }
            commentDisplay.classList.toggle('has-content', !!active);
        }
        // The move-picker itself is hidden outright now (see site.css's
        // .pgn-study-move-picker) — pgn-study no longer asks the reader to
        // choose at a branch point at all; it just keeps going on the
        // mainline, as if the variation weren't there (still readable as
        // parenthetical text in the move list itself, same as any other
        // variation). ChessPublica's own goTo() still refuses a plain
        // "next" step at a branch point until its picker's own mainline
        // row is clicked — nothing outside its bundle can flip the
        // internal flag that click sets any other way — so resolving one
        // always means clicking that row.
        //
        // Called only from a reader's own explicit single step — next
        // button, a real arrow key, or re-clicking the exact move a picker
        // is already showing for (see those call sites) — never on its
        // own. An earlier version also called this passively, from the
        // observer below, so autoplay could step through a branch with no
        // button of its own to force a click from; getting that right
        // turned out to need its own delay (to pace a resolved branch like
        // any other move instead of an instant jump cut) and its own
        // "was this really still autoplaying" signal (ChessPublica doesn't
        // set state.playing false the instant it hits a branch, only after
        // a few more of its own ticks keep failing — long enough to run
        // into that same delay and read a stale false back). Autoplay
        // itself is gone now (see onReady's button pruning above), so none
        // of that is needed any more: every call here is already the one
        // explicit step it resolves, immediately, every time. Returns
        // whether it actually resolved something, so a caller like
        // navigate() above can tell whether it still needs to take its own
        // next step afterward.
        //
        // Clicking the row has a side effect worth guarding, though:
        // confirmed directly, it sets state.playing true regardless of
        // whether it was already running. Nothing in this file starts
        // autoplay any more, but there's no guarantee ChessPublica's own
        // bundle never does on its own (a keyboard shortcut it binds
        // itself, say) — undoing it here costs nothing when it was already
        // false, and keeps this file's "no autoplay" story true regardless.
        function resolveBranch() {
            var mainlineRow = study.querySelector('.pgn-study-picker-row.mainline');
            if (!mainlineRow) return false;
            var player = study.querySelector('pgn-player');
            var engine = player && player._engine;
            mainlineRow.click();
            if (engine && engine.state && engine.state.playing && typeof engine.togglePlay === 'function') {
                engine.togglePlay();
            }
            return true;
        }
        study.resolveBranch = resolveBranch;
        stripCollapsed();
        resolveBranch();
        if (study.classList.contains('cp-ready')) {
            onReady();
            readyHandled = true;
        }
        var observer = new MutationObserver(function () {
            stripCollapsed();
            if (!readyHandled && study.classList.contains('cp-ready')) {
                onReady();
                readyHandled = true;
            }
            keepLayoutOrder();
            syncActiveComment();
        });
        observer.observe(study, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
    });
})();

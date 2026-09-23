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
    // Prev/next buttons live in the ribbon itself, right after Play, styled
    // as .pgn-study-ribbon-btn like ChessPublica's own Play/Settings so
    // they blend in rather than looking like a separate, bolted-on control
    // (our own .pgn-switcher-btn look would clash with the ribbon's actual
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

    studies.forEach(function (study) {
        var readyHandled = false;
        var lastMirroredSource = null;
        function onReady() {
            study.style.setProperty('--left-col-width', '1fr');
            study.style.setProperty('--right-col-width', '2fr');

            var buttons = Array.prototype.slice.call(study.querySelectorAll('.pgn-study-ribbon-btn'));
            var playBtn = null;
            buttons.forEach(function (btn) {
                var label = (btn.getAttribute('aria-label') || btn.getAttribute('title') || btn.textContent || '').trim();
                // .pgn-study-article-btn is the mobile-only board/article-view
                // toggle — redundant now that the board stays visible and the
                // active comment is mirrored automatically below it, so it's
                // removed by class rather than guessed-at label text.
                if (btn.classList.contains('pgn-study-article-btn') || /table.*of.*contents|\btoc\b/i.test(label) || /collapse|expand/i.test(label)) {
                    btn.remove();
                } else if (/^play\b/i.test(label)) {
                    btn.setAttribute('aria-label', 'Oynat');
                    btn.title = 'Oynat';
                    playBtn = btn;
                } else if (/setting/i.test(label)) {
                    btn.setAttribute('aria-label', 'Ayarlar');
                    btn.title = 'Ayarlar';
                }
            });

            var ribbon = study.querySelector('.pgn-study-ribbon');
            if (ribbon && !study.querySelector('[data-pgn-nav]')) {
                function navigate(dir) {
                    // ChessPublica's own document-level keydown listener acts
                    // on whichever pgn-study/pgn-player it last saw a
                    // hover/click/touch on — dispatching a real mouseenter on
                    // this study first (our button click alone never bubbles
                    // one to it) makes sure that's this study, not whichever
                    // one the reader last actually touched. Any branch point
                    // in the way is resolved automatically the moment it
                    // appears (see autoResolveBranch below), so a plain
                    // ArrowRight/ArrowLeft dispatch is all "next"/"prev" ever
                    // needs.
                    study.dispatchEvent(new MouseEvent('mouseenter'));
                    document.dispatchEvent(new KeyboardEvent('keydown', {
                        code: dir === 'next' ? 'ArrowRight' : 'ArrowLeft',
                        bubbles: true
                    }));
                }

                var insertAfter = playBtn;
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
                    if (insertAfter) {
                        insertAfter.insertAdjacentElement('afterend', btn);
                    } else {
                        ribbon.appendChild(btn);
                    }
                    insertAfter = btn;
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
        // internal flag that click sets any other way — so this clicks it
        // automatically, the instant one appears, before a reader who can
        // no longer see it ever could. That instant resolution is also
        // why nothing else in this file needs its own branch-point
        // special case any more (an earlier version had three: nav
        // buttons, the ArrowRight/Left handler, and a move-list click
        // handler) — by the time any of those could run, the branch is
        // already gone.
        //
        // Clicking that row has a side effect worth guarding, though:
        // confirmed directly, it sets state.playing true regardless of
        // whether Play was already running, not just when it was. Left
        // alone, a reader who reaches a branch by stepping one move at a
        // time (next button/arrow key, Play never pressed) would see the
        // game silently start autoplaying on its own right after — this
        // click didn't ask for that, so it's undone, same as a real
        // reader's own click on a now-hidden mainline row would have done
        // before this went automatic. Left *on* when Play was already
        // running before this click, though, since that's the one case
        // this whole function exists for: without it, autoplay hits a
        // branch point and simply stops dead (confirmed directly) with no
        // way for a reader who can't see the picker to ever restart it.
        function autoResolveBranch() {
            var mainlineRow = study.querySelector('.pgn-study-picker-row.mainline');
            if (!mainlineRow) return;
            var player = study.querySelector('pgn-player');
            var engine = player && player._engine;
            var wasPlaying = !!(engine && engine.state && engine.state.playing);
            mainlineRow.click();
            if (!wasPlaying && engine && engine.state && engine.state.playing && typeof engine.togglePlay === 'function') {
                engine.togglePlay();
            }
        }
        stripCollapsed();
        autoResolveBranch();
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
            autoResolveBranch();
        });
        observer.observe(study, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
    });
})();

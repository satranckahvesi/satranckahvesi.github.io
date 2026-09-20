(function () {
    var body = document.querySelector('.post-body');
    if (!body) return;
    var headerLineRe = /^\[[A-Za-z]+\s+"/;
    var fenTagRe = /^\[FEN\s+"/;
    var movetextRe = /^(\{|\d+\.)/;

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

    // Every [Tag "..."] header (plus its movetext, if any) must be authored
    // inside a ~~~ fenced code block, not as a bare paragraph. Markdown's
    // block-level parsing — lists, blockquotes, emphasis, smart quotes —
    // never runs inside a fenced block, so a movetext line that happens to
    // start with "20." or "41." can never be mistaken for an ordered-list
    // marker and silently lose that number the way it once did as plain
    // paragraph text (kramdown would parse "1. e4 e5 ... 20. Rd4" as an
    // ordered list continuing from "1.", consuming "20." as list markup and
    // discarding it from the text). A <pre><code> block's textContent is
    // also handed back byte-for-byte (HTML-entity-decoded, but otherwise
    // untouched) — no ambiguity about where one line ends and the next
    // begins, unlike reassembling text split across a <p>/<ol> pair.
    var codeBlocks = Array.prototype.slice.call(body.querySelectorAll('pre > code'));
    for (var i = 0; i < codeBlocks.length; i++) {
        var codeEl = codeBlocks[i];
        var pre = codeEl.parentNode;
        if (!pre || !pre.parentNode) continue;
        var lines = codeEl.textContent.split('\n').map(function (s) { return s.trim(); }).filter(function (s) { return s.length; });
        if (!lines.length || !headerLineRe.test(lines[0])) continue;

        // Collect the leading run of "[Tag "value"]" header lines; every
        // remaining non-blank line is movetext (there's no more "inline vs.
        // next sibling" distinction to make — header and movetext share one
        // fenced block, blank line between them or not).
        var idx = 0;
        while (idx < lines.length && headerLineRe.test(lines[idx])) idx++;
        var headerLines = lines.slice(0, idx);
        var moveLines = lines.slice(idx);
        var hasFenTag = headerLines.some(function (l) { return fenTagRe.test(l); });

        var moveText = null;
        if (moveLines.length && movetextRe.test(moveLines[0])) {
            moveText = moveLines.join(' ');
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
            storageKey = 'pgn-view:' + location.pathname + ':' + pgnBlockIndex;
            pgnBlockIndex++;
            // Left in place (not removed after reading): switching another
            // block's view reloads the page too, and clearing this on read
            // would wipe out this block's remembered choice on that reload
            // even though the reader never touched this block.
            var savedView = sessionStorage.getItem(storageKey);
            if (pgnViewKeys.indexOf(savedView) !== -1) tagName = savedView;
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

        if (storageKey) {
            var wrap = document.createElement('div');
            wrap.className = 'pgn-switcher-block';
            var switcher = document.createElement('div');
            switcher.className = 'pgn-switcher';
            switcher.setAttribute('role', 'group');
            switcher.setAttribute('aria-label', 'Görünüm seç');
            pgnViews.forEach(function (view) {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'pgn-switcher-btn' + (view.key === tagName ? ' is-active' : '');
                btn.setAttribute('aria-pressed', view.key === tagName ? 'true' : 'false');
                btn.title = view.label;
                btn.setAttribute('aria-label', view.label);
                btn.innerHTML = view.icon;
                btn.addEventListener('click', (function (key, chosenView) {
                    return function () {
                        sessionStorage.setItem(key, chosenView);
                        location.reload();
                    };
                })(storageKey, view.key));
                switcher.appendChild(btn);
            });
            wrap.appendChild(switcher);
            wrap.appendChild(el);
            pre.parentNode.insertBefore(wrap, pre);
        } else {
            pre.parentNode.insertBefore(el, pre);
        }
        pre.remove();
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

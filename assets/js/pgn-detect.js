(function () {
    var body = document.querySelector('.post-body');
    if (!body) return;

    // ChessPublica reads a comment's own [P] / [P n] marker (n plies,
    // defaulting to 1) as "make this position a puzzle" — the reader has
    // to find the actual move themselves before the game continues. That
    // only does anything in the interactive views: "Parti görünümü" just
    // prints the game as text, so a [P] marker sitting in there is inert.
    // A <pgn> block that contains one is therefore opened in "Oynatıcı
    // görünümü" by default, unless the reader already picked a view for
    // it themselves.
    var pMarkerRe = /\[P\s*\d*\]/;

    // The reader can switch a <pgn> block between the three ways
    // ChessPublica can show a game. The library only scans the DOM once
    // on load, so switching can't re-render an element in place —
    // instead the chosen view is stashed and the page reloaded, so the
    // right tag exists before that scan runs. The stash is kept (not
    // cleared on read), so it survives every subsequent reload for the
    // rest of the tab's session — including the reload triggered by
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

    // Posts author every game directly as <pgn>...</pgn> (or a bare
    // diagram as <fen>...</fen>) in the markdown source — kramdown passes
    // an unrecognized tag through as a raw HTML block completely
    // untouched (no list/paragraph/smart-quote parsing ever runs inside
    // one), so the exact PGN text always reaches here byte-for-byte,
    // whatever it looks like as source lines. <fen> never has alternate
    // views, so only <pgn> blocks are handled below.
    var pgnEls = Array.prototype.slice.call(body.querySelectorAll('pgn'));
    pgnEls.forEach(function (el, index) {
        if (!el.parentNode) return;

        var storageKey = 'pgn-view:' + location.pathname + ':' + index;
        var savedView = sessionStorage.getItem(storageKey);
        var defaultView = pMarkerRe.test(el.textContent) ? 'pgn-player' : 'pgn';
        var tagName = pgnViewKeys.indexOf(savedView) !== -1 ? savedView : defaultView;

        // Jarring in <pgn-study>: a reader working through a whole
        // annotated game doesn't expect to be quizzed mid-read. Stripped
        // before ChessPublica ever sees it (same regex it uses itself, so
        // the comment text left behind reads exactly as it would if the
        // marker had been recognized and removed) rather than turning
        // puzzle mode off after the fact, which isn't exposed as an
        // option. <pgn>/<pgn-player> keep the marker.
        var content = tagName === 'pgn-study' ? el.textContent.replace(/\[P\s*\d*\]/g, '') : el.textContent;

        var gameEl = el;
        if (tagName !== 'pgn' || content !== el.textContent) {
            gameEl = document.createElement(tagName);
            gameEl.textContent = content;
        }

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
            btn.addEventListener('click', (function (chosenView) {
                return function () {
                    sessionStorage.setItem(storageKey, chosenView);
                    location.reload();
                };
            })(view.key));
            switcher.appendChild(btn);
        });
        wrap.appendChild(switcher);
        el.parentNode.insertBefore(wrap, el);
        wrap.appendChild(gameEl);
        if (gameEl !== el) el.remove();
    });

    // Signals that every <pgn> block has settled on its final view tag
    // (<pgn>, <pgn-player> or <pgn-study>) before ChessPublica's own
    // single DOM scan runs. assets/js/curly-quotes.js waits on this flag
    // /event before doing its own pass, even though its skip-by-tag-name
    // check would already leave <pgn>-family content alone either way —
    // kept for the reload-driven swap above to finish first regardless.
    window.satranckahvesiPgnTagsReady = true;
    document.dispatchEvent(new CustomEvent('satranckahvesi:pgn-tags-ready'));
})();

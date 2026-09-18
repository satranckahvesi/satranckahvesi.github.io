(function () {
    var body = document.querySelector('.post-body');
    if (!body) return;
    var headerLineRe = /^\[[A-Za-z]+\s+"/;
    var fenTagRe = /^\[FEN\s+"/;
    var movetextRe = /^(\{|\d+\.)/;

    // For a plain <pgn> game (not <fen>/<puzzle>), the reader can switch
    // between the three ways ChessPublica can show a game. The library only
    // scans the DOM once on load, so switching can't re-render an element
    // in place — instead the chosen view is stashed and the page reloaded,
    // so the right tag exists before that scan runs. Every ordinary visit
    // (a fresh load, or a manual refresh) is meant to start at <pgn> again
    // — the stash is read and immediately cleared, so it only survives the
    // one reload it was written for, not any load after that.
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

        // A header + movetext pair is a full game (<pgn>), unless the header
        // carries a [FEN ...] tag, in which case it's a position + solution
        // puzzle (<puzzle>). A bare [FEN "..."] header with no movetext is a
        // static diagram (<fen>).
        var tagName;
        if (moveText !== null) {
            tagName = hasFenTag ? 'puzzle' : 'pgn';
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
            // sessionStorage, not localStorage, and consumed (removed)
            // the moment it's read: it only needs to survive the single
            // reload a switcher click triggers, not be remembered for a
            // future visit.
            var savedView = sessionStorage.getItem(storageKey);
            sessionStorage.removeItem(storageKey);
            if (pgnViewKeys.indexOf(savedView) !== -1) tagName = savedView;
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
            p.parentNode.insertBefore(wrap, p);
        } else {
            p.parentNode.insertBefore(el, p);
        }
        p.remove();
        if (next) next.remove();
    }

    // Signals that every [Tag "..."] header block on this page has been
    // replaced by its real <pgn>/<fen>/<puzzle>/... element. site.css's
    // curly-quote pass (assets/js/curly-quotes.js) depends on those tags
    // already existing so it knows what PGN/FEN text to leave untouched —
    // converting a straight quote inside literal, still-unconverted PGN
    // header text would corrupt it. Both scripts happen to load in a fixed
    // order today (this one first), but curly-quotes.js waits for this
    // event explicitly instead of relying on that load order.
    document.dispatchEvent(new CustomEvent('satranckahvesi:pgn-tags-ready'));
})();

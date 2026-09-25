(function () {
    var studies = document.querySelectorAll('.post-body pgn-study');
    if (!studies.length) return;

    // ChessPublica renders a move-quality NAG (e.g. "!?", "??") as a
    // floating .gm-badge positioned over the board wherever that move
    // landed, but clearing/creating/repositioning it depends on its own
    // renderGlyph running again for the newly shown position — and its
    // click handler for a move nested inside a variation always calls
    // that with the NAG hardcoded to null (confirmed directly in its
    // bundle). Three ways that goes wrong, all stemming from the same
    // root cause:
    //
    // 1. Entering a variation with no NAG of its own and stepping to its
    //    second move can leave a stale "!?" badge sitting over an empty
    //    square, left over from an unrelated mainline move several plies
    //    back that happens to share that square.
    // 2. Clicking directly into a move nested inside a variation that
    //    does carry its own NAG (confirmed on a "!"-annotated move
    //    several levels deep) leaves the badge at its last position
    //    instead — which silently looks fine whenever the new move
    //    happens to carry the *same* symbol (e.g. "!") as whatever
    //    produced the stale badge, since only the label matched, not the
    //    square.
    // 3. Clicking directly into a variation move whose own NAG symbol
    //    (e.g. "??") never appears anywhere else in that same study
    //    (confirmed directly: no stale badge to leave behind, and the
    //    null-NAG call renders nothing) shows no badge at all, even
    //    though the move itself is clearly annotated in its own move
    //    text.
    //
    // There's no ChessPublica option to force a re-check, so this
    // derives the correct badge state itself instead, from the one move
    // actually marked .pgn-move-active — the authoritative "what's on
    // the board right now". Its own rendered text already carries its
    // NAG symbol (ChessPublica appends it straight onto the SAN, e.g.
    // "Nc5??"), so that symbol is read directly off the trailing
    // characters rather than trusted to whatever ChessPublica's own
    // (buggy, for a variation click) render pass produced. A move with no
    // such trailing symbol should show no badge at all, so any leftover
    // one is stale and removed (case 1). A move that does carry one gets
    // the badge created (case 3) or moved (case 2) onto its own data-to
    // square, which ChessPublica stamps on every variation move span at
    // render time and which the buggy click handler ignores. Mainline
    // moves (data-ply, not data-fen/data-to — pgn-study never actually
    // "enters" a variation, it always shows one as parenthetical text
    // clicked into directly, so only a variation move ever carries
    // data-to) are left to ChessPublica's own, already-correct render
    // path, since there's no square to place a badge at without it.
    var NAG_LABELS = ['??', '!!', '!?', '?!', '!', '?'];
    var NAG_COLORS = {
        '!!': '#1aa34a',
        '!': '#00AA00',
        '!?': '#0000FF',
        '?!': '#FFAA00',
        '?': '#FF0000',
        '??': '#9c0202'
    };
    function trailingNagLabel(text) {
        for (var i = 0; i < NAG_LABELS.length; i++) {
            var label = NAG_LABELS[i];
            if (text.slice(-label.length) === label) return label;
        }
        return null;
    }
    function fixBadge(study) {
        var active = study.querySelector('.pgn-move.pgn-move-active');
        var activeText = active ? active.textContent : '';
        var expectedLabel = trailingNagLabel(activeText);
        var badge = study.querySelector('.gm-badge');

        if (!expectedLabel) {
            if (badge) badge.remove();
            return;
        }

        var targetSquare = active.dataset.to;
        if (!targetSquare) return;
        var boardEl = study.querySelector('.board');
        var squareEl = boardEl && boardEl.querySelector('[data-square="' + targetSquare + '"]');
        if (!boardEl || !squareEl) return;

        if (!badge || badge.textContent !== expectedLabel) {
            if (badge) badge.remove();
            badge = document.createElement('div');
            badge.className = 'gm-badge';
            badge.textContent = expectedLabel;
            badge.style.background = NAG_COLORS[expectedLabel];
            badge.style.position = 'absolute';
            badge.style.zIndex = '30';
            boardEl.appendChild(badge);
        }

        var boardRect = boardEl.getBoundingClientRect();
        var squareRect = squareEl.getBoundingClientRect();
        var right = boardRect.right - squareRect.right + squareRect.width * 0.05;
        var top = squareRect.top - boardRect.top - squareRect.height * 0.05;
        // Always written, not just when it differs from the previous
        // value by some threshold: a freshly created badge's own
        // style.right/top start out as an empty string, and
        // parseFloat('') is NaN — every comparison against it is false,
        // so a "only write it if it changed" guard here would silently
        // skip writing a fresh badge's position at all.
        badge.style.right = right + 'px';
        badge.style.top = top + 'px';
    }

    studies.forEach(function (study) {
        fixBadge(study);
        new MutationObserver(function () {
            fixBadge(study);
        }).observe(study, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    });
})();

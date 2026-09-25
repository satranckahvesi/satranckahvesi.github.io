(function () {
    var studies = document.querySelectorAll('.post-body pgn-study');
    if (!studies.length) return;

    // ChessPublica renders a NAG's symbol (e.g. "!?") as a floating
    // .gm-badge positioned over the board wherever that move landed, but
    // clearing/repositioning it depends on its own renderGlyph running
    // again for the newly shown position. Two ways that goes wrong:
    //
    // 1. Entering a variation with no NAG of its own and stepping to its
    //    second move can leave a stale "!?" badge sitting over an empty
    //    square, left over from an unrelated mainline move several plies
    //    back that happens to share that square.
    // 2. Clicking directly into a move nested inside a variation
    //    (confirmed on a "!"-annotated move several levels deep) always
    //    goes through ChessPublica's click handler with the NAG hardcoded
    //    to null, so the badge is never told where to go and just stays
    //    at its last position — which silently looks fine whenever the
    //    new move happens to carry the *same* symbol (e.g. "!") as
    //    whatever produced the stale badge, since only the label matches,
    //    not the square.
    //
    // There's no ChessPublica option to force a re-check, so this watches
    // for both mismatches instead. The one move actually marked
    // .pgn-move-active is the authoritative "what's on the board right
    // now": a badge whose own label text doesn't appear in that move's
    // text is stale and gets removed (case 1); a badge that does match by
    // label but sits over the wrong square gets moved to the move's own
    // data-to square, which ChessPublica stamps on every variation move
    // span at render time and which the buggy click handler ignores
    // (case 2).
    function fixBadge(study) {
        var badge = study.querySelector('.gm-badge');
        if (!badge || !badge.textContent) return;
        var active = study.querySelector('.pgn-move.pgn-move-active');
        var activeText = active ? active.textContent : '';
        if (activeText.indexOf(badge.textContent) === -1) {
            badge.remove();
            return;
        }
        var targetSquare = active.dataset.to;
        if (!targetSquare) return;
        var boardEl = badge.parentElement;
        var squareEl = boardEl && boardEl.querySelector('[data-square="' + targetSquare + '"]');
        if (!boardEl || !squareEl) return;
        var boardRect = boardEl.getBoundingClientRect();
        var squareRect = squareEl.getBoundingClientRect();
        var right = boardRect.right - squareRect.right + squareRect.width * 0.05;
        var top = squareRect.top - boardRect.top - squareRect.height * 0.05;
        if (Math.abs(parseFloat(badge.style.right) - right) > 0.5 ||
            Math.abs(parseFloat(badge.style.top) - top) > 0.5) {
            badge.style.right = right + 'px';
            badge.style.top = top + 'px';
        }
    }

    studies.forEach(function (study) {
        fixBadge(study);
        new MutationObserver(function () {
            fixBadge(study);
        }).observe(study, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    });
})();

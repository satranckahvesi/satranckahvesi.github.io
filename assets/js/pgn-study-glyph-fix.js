(function () {
    var studies = document.querySelectorAll('.post-body pgn-study');
    if (!studies.length) return;

    // ChessPublica renders a NAG's symbol (e.g. "!?") as a floating
    // .gm-badge positioned over the board wherever that move landed, but
    // clearing the previous one depends on its own renderGlyph running
    // again for the newly shown position — confirmed directly by
    // reproducing it: entering a variation with no NAG of its own and
    // stepping to its second move left a stale "!?" badge sitting over
    // an empty square, left over from an unrelated mainline move several
    // plies back that happens to share that square. There's no
    // ChessPublica option to force a re-check, so this watches for
    // exactly that mismatch instead: the one move actually marked
    // .pgn-move-active is the authoritative "what's on the board right
    // now", so a badge whose own label text doesn't appear in that
    // move's text is stale and gets removed directly.
    function pruneStaleBadge(study) {
        var badge = study.querySelector('.gm-badge');
        if (!badge || !badge.textContent) return;
        var active = study.querySelector('.pgn-move.pgn-move-active');
        var activeText = active ? active.textContent : '';
        if (activeText.indexOf(badge.textContent) === -1) badge.remove();
    }

    studies.forEach(function (study) {
        pruneStaleBadge(study);
        new MutationObserver(function () {
            pruneStaleBadge(study);
        }).observe(study, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    });
})();

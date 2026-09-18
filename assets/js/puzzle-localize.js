(function () {
    // A solved <puzzle> always gets ChessPublica's own hardcoded English
    // "🏆 Puzzle solved!" appended to .cp-puzzle-caption-text — after a
    // <br>, but only when that box already held something (confirmed
    // directly in its bundle: `d.childNodes.length && d.appendChild(br)`
    // runs right before the span is appended). That existing content is
    // the winning move's own PGN comment, rendered there earlier by the
    // same engine, so a puzzle whose solving move has a comment ends up
    // showing both the author's own text and the generic English one
    // together. There's no ChessPublica option to turn the auto message
    // off or localize it, so this mirrors its own "did the box already
    // have content" check to decide which of the two outcomes applies:
    // drop the generic line entirely when a comment is already showing,
    // or swap it for a Turkish equivalent when the box was empty.
    var SOLVED_EN = '\u{1F3C6} Puzzle solved!';
    var SOLVED_TR_NO_COMMENT = '\u{1F3C6} Tebrikler, bulmacayı çözdünüz!';

    function handleAddedNode(node) {
        if (node.nodeType !== 1 || node.tagName !== 'SPAN' || node.textContent !== SOLVED_EN) return;
        var prev = node.previousSibling;
        if (prev && prev.nodeType === 1 && prev.tagName === 'BR') {
            // A comment was already displayed; the <br> only exists to
            // separate it from the message being removed here, so it goes
            // too — otherwise a trailing blank line would remain.
            prev.remove();
            node.remove();
        } else {
            node.textContent = SOLVED_TR_NO_COMMENT;
        }
    }

    function observeCaption(captionEl) {
        new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                mutation.addedNodes.forEach(handleAddedNode);
            });
        }).observe(captionEl, { childList: true });
    }

    var body = document.querySelector('.post-body');
    if (!body) return;

    // <puzzle> is replaced wholesale with a fresh .cp-puzzle (and a new
    // .cp-puzzle-caption-text inside it) by ChessPublica's own init, which
    // runs after this deferred script, and again on every reset — so
    // .cp-puzzle-caption-text can't just be queried once up front. This
    // keeps watching for the whole life of the page instead, the same
    // approach pgn-study-enhance.js uses for ChessPublica elements that
    // appear on their own schedule.
    body.querySelectorAll('.cp-puzzle-caption-text').forEach(observeCaption);
    new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
                if (node.nodeType !== 1) return;
                if (node.matches && node.matches('.cp-puzzle-caption-text')) observeCaption(node);
                if (node.querySelectorAll) {
                    node.querySelectorAll('.cp-puzzle-caption-text').forEach(observeCaption);
                }
            });
        });
    }).observe(body, { childList: true, subtree: true });
})();

(function () {
    var body = document.querySelector('.post-body');
    if (!body) return;

    var HINT_RE = /^Find the best move for (White|Black)\.$/;
    var HINT_TR = {
        White: 'Beyaz için en iyi hamleyi bulun.',
        Black: 'Siyah için en iyi hamleyi bulun.'
    };

    function localize(el) {
        var m = HINT_RE.exec(el.textContent);
        if (m) el.textContent = HINT_TR[m[1]];
    }

    // The "show solution" button's own tooltip and screen-reader label are
    // fixed in ChessPublica's board template, so unlike the prompt above
    // they only need translating once per button, when it first appears.
    var SOLUTION_EN = 'Show solution move';
    var SOLUTION_TR = 'Çözümü göster';

    function localizeButton(btn) {
        if (btn.title === SOLUTION_EN) btn.title = SOLUTION_TR;
        if (btn.getAttribute('aria-label') === SOLUTION_EN) btn.setAttribute('aria-label', SOLUTION_TR);
    }

    // ChessPublica writes this hardcoded English prompt into
    // .puzzle-hint-text via a plain `textContent = ...` assignment every
    // time a puzzle position activates — for as long as the page lives and
    // however many <pgn-player>/<pgn-study> boards it holds — so this can't
    // be a one-time scan. A textContent assignment also reports as the old
    // text node being removed and a new one added, not as a readable change
    // to existing node text, so mutations are used only as a signal to
    // re-check the element rather than to diff their content directly.
    body.querySelectorAll('.puzzle-hint-text').forEach(localize);
    body.querySelectorAll('.puzzle-hint-btn').forEach(localizeButton);
    new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            var el = mutation.target.nodeType === 3 ? mutation.target.parentNode : mutation.target;
            if (el && el.nodeType === 1 && el.classList && el.classList.contains('puzzle-hint-text')) localize(el);
            mutation.addedNodes.forEach(function (node) {
                if (node.nodeType !== 1) return;
                if (node.matches && node.matches('.puzzle-hint-text')) localize(node);
                if (node.querySelectorAll) node.querySelectorAll('.puzzle-hint-text').forEach(localize);
                if (node.matches && node.matches('.puzzle-hint-btn')) localizeButton(node);
                if (node.querySelectorAll) node.querySelectorAll('.puzzle-hint-btn').forEach(localizeButton);
            });
        });
    }).observe(body, { childList: true, subtree: true, characterData: true });
})();

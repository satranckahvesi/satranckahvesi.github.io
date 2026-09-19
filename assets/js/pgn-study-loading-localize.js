(function () {
    var body = document.querySelector('.post-body');
    if (!body) return;

    var LOADING_EN = 'Loading game…';
    var LOADING_TR = 'Oyun yükleniyor…';

    function localize(node) {
        var p = node.querySelector('.pgn-study-loading-side p');
        if (p && p.textContent === LOADING_EN) p.textContent = LOADING_TR;
    }

    // <pgn-study> inserts its own loading skeleton as a preceding sibling
    // (insertAdjacentHTML("beforebegin", ...)) the instant it upgrades —
    // before this deferred script's own load, for a fast page, so a plain
    // one-time scan can still miss it. Same MutationObserver-on-.post-body
    // approach as puzzle-localize.js, watching for the whole life of the
    // page since a page can hold more than one <pgn-study>.
    body.querySelectorAll('.pgn-study-loading').forEach(localize);
    new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
                if (node.nodeType !== 1) return;
                if (node.matches && node.matches('.pgn-study-loading')) localize(node);
                if (node.querySelectorAll) {
                    node.querySelectorAll('.pgn-study-loading').forEach(localize);
                }
            });
        });
    }).observe(body, { childList: true, subtree: true });
})();

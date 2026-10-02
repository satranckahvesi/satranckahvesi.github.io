(function () {
    // pgn-detect.js writes an unevaluated ply as [%eval 8] and caps every
    // real evaluation at 7.5. ChessPublica's eval bar maps a value e (in
    // pawns, clamped to +-8) to a fill height of (tanh(0.4 * e) + 1) / 2 *
    // 100 percent, so a bar sitting at the height for exactly 8 means "this
    // position has no evaluation" — but only in a game marked with
    // data-eval-gaps, since a game carrying its own [%eval] values may
    // legitimately reach 8 or more. It can't be hidden through ChessPublica
    // itself (its bar only has an all-or-nothing disabled state), so the
    // fill's style is watched here and the bar made invisible — keeping its
    // space, so the board doesn't shift — whenever it lands on that height.
    var unknownFill = (Math.tanh(0.4 * 8) + 1) / 2 * 100;

    function sync(fill) {
        var bar = fill.parentElement;
        if (!bar) return;
        var h = parseFloat(fill.style.height);
        var gaps = !!fill.closest('[data-eval-gaps]');
        bar.classList.toggle('eval-unknown', gaps && isFinite(h) && Math.abs(h - unknownFill) < 0.01);
    }

    function syncAll() {
        Array.prototype.forEach.call(document.querySelectorAll('.eval-fill'), sync);
    }

    new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
            if (m.target.classList && m.target.classList.contains('eval-fill')) sync(m.target);
        });
    }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['style'] });

    syncAll();
    document.addEventListener('cp-ready', syncAll, true);
    window.addEventListener('load', syncAll);
})();

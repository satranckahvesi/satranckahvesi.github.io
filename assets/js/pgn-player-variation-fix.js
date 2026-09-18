(function () {
    var players = document.querySelectorAll('.post-body pgn-player');
    if (!players.length) return;

    // Clicking into a variation's move list inside .video-comment (ChessPublica's
    // own "Play"-able variation preview under the board) calls its
    // engine.enterVariation(...), which stores that exact .variation-content
    // DOM node as engine._variation.contentEl and keeps its .var-move
    // "active" class in sync with every further step, confirmed directly.
    // But .video-comment itself gets wiped (innerHTML = "") and rebuilt from
    // scratch on every single step, to reflect whatever comment/variation
    // belongs to the current ply — and only a variation's own first move
    // carries that data, so every step after it rebuilds .video-comment
    // into an empty shell, taking contentEl out of the visible DOM even
    // though ChessPublica keeps updating it in memory the whole time
    // (verified directly: engine._variation.contentEl.isConnected is false,
    // yet its .var-move.active class keeps moving correctly). Reparenting
    // that same live node back in - rather than a clone - means it keeps
    // reflecting those updates for free, so the variation's move text
    // (and which move is current within it) stays visible under the board
    // for as long as the reader is still inside that variation.
    //
    // Nothing to do once they leave it: engine._variation itself goes
    // false then, and ChessPublica's own next legitimate re-render already
    // clears .video-comment for the mainline position that follows.
    function restore(player) {
        var engine = player._engine;
        var variation = engine && engine._variation;
        if (!variation || !variation.contentEl) return;
        var videoComment = player.querySelector('.video-comment');
        if (!videoComment || videoComment.contains(variation.contentEl)) return;
        videoComment.appendChild(variation.contentEl);
    }

    Array.prototype.slice.call(players).forEach(function (player) {
        new MutationObserver(function () {
            restore(player);
        }).observe(player, { childList: true, subtree: true });
    });
})();

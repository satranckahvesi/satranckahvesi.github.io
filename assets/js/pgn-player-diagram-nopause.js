(function () {
    var players = document.querySelectorAll('.post-body pgn-player');
    if (!players.length) return;

    // A "{[D]}" (or "{ [D] }") comment marks a diagram position and
    // nothing else. ChessPublica keeps no comment text for it, but still
    // records it in state.diagrams, and its comment box counts a diagram
    // as "something to show here": update() returns true, and the engine
    // treats that as a reason to pause playback (or to hide the play
    // button while paused). The diagram itself is never visible in the
    // player — site.css hides .comment-diagram under the board — so a
    // reader just sees playback stop for no reason.
    //
    // The comment box is wrapped so a position whose only content is a
    // diagram is reported to update() as having none. Anything else at
    // that position — a comment, a variation — still goes through
    // untouched, and still pauses as before.
    function patch(engine) {
        var box = engine && engine.commentBox;
        if (!box || box._diagramNoPause) return;
        var original = box.update;
        box._diagramNoPause = true;
        box.update = function (index, comments, variations, diagrams) {
            var args = Array.prototype.slice.call(arguments);
            var hasVariations = variations && variations[index] && variations[index].length;
            if (diagrams && diagrams[index] && !(comments && comments[index]) && !hasVariations) {
                var copy = diagrams.slice();
                copy[index] = null;
                args[3] = copy;
            }
            return original.apply(this, args);
        };
    }

    Array.prototype.slice.call(players).forEach(function (player) {
        function run() { patch(player._engine); }
        if (player._engine) run();
        player.addEventListener('cp-ready', run);
    });
})();

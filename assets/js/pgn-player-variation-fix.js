(function () {
    var players = document.querySelectorAll('.post-body pgn-player');
    if (!players.length) return;

    function toArray(list) {
        return Array.prototype.slice.call(list);
    }

    function isBlock(el) {
        return el.classList && el.classList.contains('variation-block');
    }

    // Clicking a move inside a variation's move list (.var-move, under
    // the board in .video-comment) calls engine.enterVariation(...), which
    // stores that list's .variation-content node as engine._variation.
    // contentEl and keeps its .var-move "active" class in sync with every
    // further step, confirmed directly. But .video-comment itself gets
    // wiped (innerHTML = "") and rebuilt from scratch on every single
    // step, to reflect whatever comment/variation belongs to the current
    // ply, and a variation's own steps only rebuild it with that one
    // move's comment plus its own child variations: the variation lists
    // the reader just clicked into (and its sibling variations) are gone
    // from the visible DOM, even though ChessPublica keeps updating them
    // in memory the whole time (verified directly: contentEl.isConnected
    // is false, yet its .var-move.active class keeps moving correctly).
    //
    // So whenever the box is rebuilt for a mainline position, its
    // top-level .variation-block nodes are remembered (the live nodes,
    // not clones, so they keep their click handlers and keep reflecting
    // those updates for free), and while the reader is inside a variation
    // the same nodes are put back in place of whatever the rebuild
    // produced. That keeps every variation of the position on screen to
    // click through, and which move is current within it visible, for as
    // long as the reader stays in there. Marked with .cp-in-variation so
    // site.css can hide the rebuild's own comment line, which the restored
    // lists already carry inline.
    function restore(player) {
        var engine = player._engine;
        var box = player.querySelector('.video-comment');
        if (!engine || !box) return;
        var variation = engine._variation;

        if (!variation) {
            box.classList.remove('cp-in-variation');
            var blocks = toArray(box.children).filter(isBlock);
            player._cpBlocks = blocks.length ? blocks : null;
            return;
        }

        box.classList.add('cp-in-variation');
        var saved = player._cpBlocks;
        var content = variation.contentEl;
        if (saved && content && saved.some(function (b) { return b.contains(content); })) {
            var present = toArray(box.children).filter(isBlock);
            var intact = present.length === saved.length && saved.every(function (b, i) {
                return present[i] === b;
            });
            if (!intact) {
                present.forEach(function (b) { box.removeChild(b); });
                saved.forEach(function (b) { box.appendChild(b); });
            }
        } else if (content && !box.contains(content)) {
            box.appendChild(content);
        }
        ensurePlayButton(box);
    }

    // The rebuild only puts ChessPublica's play button back when the
    // current move has a comment or child variations of its own, so a
    // plain variation move would leave the box without one. Inside a
    // variation the button is made here when missing, and always drawn
    // as a plain play glyph (borrowed from the hidden per-variation play
    // icon) since ChessPublica's replay glyph at a variation's end isn't
    // what pressing it does here: see the click handler below.
    function ensurePlayButton(box) {
        var button = box.querySelector(':scope > .comment-play-btn');
        if (!button) {
            button = document.createElement('button');
            button.className = 'comment-play-btn';
            button.appendChild(document.createElement('span')).className = 'lucide-icon';
            box.appendChild(button);
        }
        var icon = button.querySelector('.lucide-icon');
        var source = box.querySelector('.variation-icon');
        if (icon && source) icon.style.setProperty('--icon', source.style.getPropertyValue('--icon'));
        if (icon) icon.setAttribute('aria-label', 'Play');
    }

    // Capture-phase, so these run ahead of ChessPublica's own handlers on
    // the same elements.
    function onClick(player, event) {
        var engine = player._engine;
        var variation = engine && engine._variation;
        var target = event.target;
        if (!target || !target.closest) return;

        // The one play button, from inside a variation: back to the
        // mainline position the variation branched from, and carry on
        // playing from there (ChessPublica's own handler would just
        // toggle the mainline's play state from wherever it was).
        if (variation && target.closest('.comment-play-btn')) {
            event.stopPropagation();
            event.preventDefault();
            var index = variation.mainStateIndex;
            engine.exitVariation();
            engine.goTo(index);
            engine.play();
            return;
        }

        // A move in another variation than the current one: leave the
        // current one first, so ChessPublica doesn't stack it as a parent
        // (which ArrowLeft would later climb back into) and so only one
        // move stays highlighted. A move in a variation nested inside the
        // current one is a real parent/child step and is left alone.
        var move = target.closest('.var-move');
        if (move) {
            var box = player.querySelector('.video-comment');
            if (variation && variation.contentEl) {
                var list = move.closest('.variation-content');
                var nested = list !== variation.contentEl && variation.contentEl.contains(list);
                if (!nested) engine.exitVariation();
            }
            if (box) {
                toArray(box.querySelectorAll('.var-move.active')).forEach(function (m) {
                    m.classList.remove('active');
                });
            }
        }
    }

    toArray(players).forEach(function (player) {
        new MutationObserver(function () {
            restore(player);
        }).observe(player, { childList: true, subtree: true });
        player.addEventListener('click', function (event) {
            onClick(player, event);
        }, true);
    });
})();

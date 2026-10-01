(function () {
    var studies = document.querySelectorAll('.post-body pgn-study');
    if (!studies.length) return;

    // ChessPublica starts a fresh paragraph after every inline diagram
    // (.cp-board-wrapper / .comment-diagram) in the move list, and opens
    // it with "N...&nbsp;" whenever that paragraph begins on Black's move
    // — the usual notation after anything that interrupts the line. But
    // site.css hides those diagrams in pgn-study (the live board in the
    // left column already shows the position), so nothing is left
    // between the two paragraphs: the reader sees "5. exd5" and then, on
    // its own line, "5... Qxd5". With nothing actually interrupting, the
    // line should read straight through as "5. exd5 Qxd5".
    //
    // So a paragraph that follows only hidden diagrams after a paragraph
    // of the same kind is folded into it: the "N...&nbsp;" prefix is
    // dropped and the spans are moved over, so ChessPublica's own click
    // and highlight handling on them keeps working. A variation, comment
    // or anything else between the two paragraphs means the break is
    // real, and the pair is left alone.
    var LINE = 'pgn-mainline';
    var VARIATION_LINE = 'pgn-variation-line';

    function isDiagram(el) {
        return el.classList.contains('cp-board-wrapper') ||
            el.classList.contains('comment-diagram');
    }

    function isLine(el) {
        return el.tagName === 'P' &&
            (el.classList.contains(LINE) || el.classList.contains(VARIATION_LINE));
    }

    function join(study) {
        var lines = study.querySelectorAll('p.' + LINE + ', p.' + VARIATION_LINE);
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var prev = line.previousElementSibling;
            var skipped = 0;
            while (prev && isDiagram(prev)) {
                prev = prev.previousElementSibling;
                skipped++;
            }
            if (!skipped || !prev || !isLine(prev) || prev.className !== line.className) continue;

            var first = line.firstChild;
            if (first && first.nodeType === 3) {
                first.nodeValue = first.nodeValue.replace(/^\s*\d+\.\.\.[\s ]*/, '');
            }
            prev.appendChild(document.createTextNode(' '));
            while (line.firstChild) prev.appendChild(line.firstChild);
            line.remove();
        }
    }

    studies.forEach(function (study) {
        var pending = false;
        function run() {
            pending = false;
            join(study);
        }
        join(study);
        // The move list is only built once ChessPublica has finished
        // rendering the study, and may be rebuilt afterwards, so it keeps
        // watching rather than running once. join() is idempotent (a
        // joined pair no longer has a diagram between its paragraphs), and
        // runs at most once per frame, so its own DOM edits only ever
        // cost one extra pass.
        new MutationObserver(function () {
            if (pending) return;
            pending = true;
            requestAnimationFrame(run);
        }).observe(study, { childList: true, subtree: true });
    });
})();

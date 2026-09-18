(function () {
    // kramdown's own smart-quote conversion is deliberately turned off
    // in _config.yml (smart_quotes mapped back to straight apos/quot):
    // it was corrupting PGN game text embedded directly in post
    // bodies, e.g. turning [Event "..."] into [Event "..."] with
    // curly quotes, or the "..." in "8... O-O" into a single "…" —
    // both silently break PGN parsing. So converting straight quotes
    // to curly ones site-wide has to happen here instead, walking the
    // rendered DOM directly rather than the markdown source, and
    // skipping exactly the elements that hold that literal PGN/FEN
    // text (plus <code>/<pre>, for the same reason as any code
    // sample) so the two don't collide again.
    var skipTags = {
        PGN: 1, FEN: 1, PUZZLE: 1, 'PGN-PLAYER': 1, 'PGN-STUDY': 1,
        CODE: 1, PRE: 1, SCRIPT: 1, STYLE: 1
    };

    // Stops climbing at `root` rather than going all the way to the
    // document root: the initial pass below walks the whole body, so
    // there `root` is document.body and every ancestor gets checked
    // as expected. The comment pass further down calls this with
    // `root` set to the comment element itself — climbing past it
    // would reach the very <pgn-study>/<pgn-player>/<pgn> tag that
    // pass exists specifically to reach *inside* of, incorrectly
    // skipping every comment it was meant to convert.
    function insideSkippedElement(node, root) {
        var el = node.parentElement;
        while (el && el !== root) {
            if (skipTags[el.tagName]) return true;
            el = el.parentElement;
        }
        return false;
    }

    // A conventional SmartyPants-style pass: a straight quote right
    // after whitespace, an opening bracket, or the very start of the
    // text becomes an opening curly quote; every other one (mid-word,
    // after a letter, or closing a quoted phrase) becomes the closing
    // form — which is also the correct character for a plain
    // apostrophe (e.g. Turkish "İstanbul'da"), since ’ serves both
    // roles in real typography. Applied per text node, so a quote
    // sitting exactly at the boundary of inline markup (like
    // **bold**) won't see the word before it — an accepted gap for a
    // script this size, and rare in this site's actual prose.
    function toCurly(text) {
        return text
            .replace(/(^|[-—\s(\[{"])'/g, '$1‘')
            .replace(/'/g, '’')
            .replace(/(^|[-—\s(\[{'])"/g, '$1“')
            .replace(/"/g, '”');
    }

    function curlyPass(root) {
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        var targets = [];
        var node;
        while ((node = walker.nextNode())) {
            if (node.nodeValue.indexOf('"') === -1 && node.nodeValue.indexOf("'") === -1) continue;
            if (insideSkippedElement(node, root)) continue;
            targets.push(node);
        }
        targets.forEach(function (node) {
            var next = toCurly(node.nodeValue);
            // Comments get re-checked on every mutation below; skip
            // the write entirely once a comment's already been
            // converted, rather than relying on toCurly's own
            // idempotence (real, since a second pass finds no more
            // straight quotes to match) — a same-value nodeValue
            // write isn't guaranteed to be a no-op for every engine's
            // MutationObserver, and this codebase has hit that exact
            // "assignment alone re-triggers the observer" bug before.
            if (node.nodeValue !== next) node.nodeValue = next;
        });
    }

    function run() {
        curlyPass(document.body);

        // This pass runs after assets/js/pgn-detect.js has replaced every
        // [Tag "..."] header block with its real <pgn>/<pgn-player>/
        // <pgn-study> element (see the wait below), so it can only see and
        // skip that raw, unrendered source text — never the comments they
        // render, since those don't exist as DOM elements yet. Comments are
        // exactly the part of that source text that's genuine prose (an
        // author's own annotation), not PGN syntax, so they still want
        // curly quotes — just applied once ChessPublica actually renders
        // them, matched by the same handful of classes it renders them
        // under (confirmed directly in its CSS) regardless of which of
        // the three views (pgn/pgn-player/pgn-study) is showing.
        var commentSelector = '.pgn-comment, .pgn-comment-inline, .video-comment, .variation-comment, .comment-text-block';
        var body = document.querySelector('.post-body');
        if (body && (body.querySelector('pgn, pgn-player, pgn-study'))) {
            var observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    mutation.addedNodes.forEach(function (added) {
                        if (added.nodeType !== 1) return;
                        if (added.matches && added.matches(commentSelector)) curlyPass(added);
                        if (added.querySelectorAll) {
                            added.querySelectorAll(commentSelector).forEach(curlyPass);
                        }
                    });
                });
            });
            observer.observe(body, { childList: true, subtree: true });
        }
    }

    // On a post page, assets/js/pgn-detect.js must replace every raw PGN
    // header block with its real <pgn>/<fen>/<puzzle>/... element before
    // this can safely run — insideSkippedElement above only knows to skip
    // those tags once they exist; running any earlier would curly-quote
    // literal, still-unconverted PGN text sitting in a plain <p> and
    // corrupt it (see the comment at the top of this file). Both scripts
    // load on every post page in a fixed order today (pgn-detect.js first),
    // but waiting for its explicit "done" event instead of relying on that
    // load order means this keeps working correctly even if that order
    // ever changes. Pages with no .post-body (the homepage, archive pages)
    // never load pgn-detect.js at all, so they run immediately instead of
    // waiting for an event that would never come.
    if (document.querySelector('.post-body')) {
        document.addEventListener('satranckahvesi:pgn-tags-ready', run, { once: true });
    } else {
        run();
    }
})();

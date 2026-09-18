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
        // under (confirmed directly in its bundle's source, ChessPublica.all.min.js).
        //
        // .pgn-variation-line carries no such wrapper of its own — it's
        // there for a different reason. In the plain, non-interactive
        // "Parti görünümü" view (the default for a bare <pgn> block, no
        // clicking required), ChessPublica's renderer only gives a
        // comment its own dedicated element on the mainline; inside a
        // side-line it instead concatenates the move notation and any
        // {...} comment text into one plain string and drops the whole
        // thing, unwrapped, straight into a single <p class="pgn-variation-line">
        // (confirmed directly by feeding this site's real PGN text through
        // the real bundle and inspecting the result: zero .pgn-comment-inline
        // elements came out, and the comment prose sat as bare text next to
        // the move numbers). So the paragraph itself is the closest thing to
        // a "comment element" a side-line ever gets, and has to be in this
        // list for its prose to be reachable at all — every one of this
        // site's straight-apostrophe reports has traced back to exactly this
        // paragraph, not to a missed mutation on some inner element. Curly-quoting
        // the whole paragraph (moves included) is safe: algebraic notation
        // and NAGs never contain a straight quote character, so nothing in
        // there can be mistaken for one.
        var commentSelector = '.pgn-comment, .pgn-comment-inline, .video-comment, .variation-comment, .comment-text-block, .pgn-variation-line';

        // Walks up from a text node (or the node itself) looking for a
        // comment element, without ever climbing past one — unlike
        // insideSkippedElement this has no root to stop at, so it's only
        // ever handed nodes that are already inside .post-body. Finding
        // one here is exactly the signal that a node belongs to genuine
        // author prose (a comment ChessPublica rendered) rather than
        // still-raw PGN/FEN source text, which is what actually keeps
        // this safe to use without also re-checking skipTags: raw PGN
        // sitting under <pgn>/<pgn-player>/<pgn-study> before ChessPublica
        // has parsed it is never inside a commentSelector element, so it
        // can never match here and get curly-quoted early.
        function closestCommentAncestor(node) {
            var el = node.nodeType === 1 ? node : node.parentElement;
            while (el) {
                if (el.matches && el.matches(commentSelector)) return el;
                el = el.parentElement;
            }
            return null;
        }

        var body = document.querySelector('.post-body');
        if (body && (body.querySelector('pgn, pgn-player, pgn-study'))) {
            // Stepping through a side-line in the interactive player can
            // replace a comment element's text in place rather than
            // swapping in a fresh element: documented directly in
            // assets/js/pgn-player-variation-fix.js, ChessPublica wipes
            // and rebuilds .video-comment on every ply and keeps reusing
            // the same live .variation-content node across that rebuild.
            // A plain childList/subtree observer still fires for that
            // update, but its addedNodes entry is the new Text node
            // dropped into the *existing* element, not a new element —
            // `added.nodeType !== 1` alone discards exactly that record.
            // Handling text-node addedNodes, and also watching
            // characterData directly (in case a future ChessPublica
            // version sets node.data instead of replacing children),
            // covers both ways a reused element could end up with new
            // text without ever firing as an added *element*.
            var observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    if (mutation.type === 'characterData') {
                        var owner = closestCommentAncestor(mutation.target);
                        if (owner) curlyPass(owner);
                        return;
                    }
                    mutation.addedNodes.forEach(function (added) {
                        if (added.nodeType === 3) {
                            var textOwner = closestCommentAncestor(added);
                            if (textOwner) curlyPass(textOwner);
                            return;
                        }
                        if (added.nodeType !== 1) return;
                        if (added.matches && added.matches(commentSelector)) curlyPass(added);
                        if (added.querySelectorAll) {
                            added.querySelectorAll(commentSelector).forEach(curlyPass);
                        }
                    });
                });
            });
            observer.observe(body, { childList: true, subtree: true, characterData: true });
        }
    }

    // On a post page, assets/js/pgn-detect.js must replace every raw PGN
    // header block with its real <pgn>/<fen>/<puzzle>/... element before
    // this can safely run — insideSkippedElement above only knows to skip
    // those tags once they exist; running any earlier would curly-quote
    // literal, still-unconverted PGN text sitting in a plain <p> and
    // corrupt it (see the comment at the top of this file). pgn-detect.js
    // loads and finishes earlier on every post page today (it's part of
    // post.html, which default.html always inserts before this script's
    // own <script> tag in its footer), so by the time this runs, that work
    // is already done and its "ready" flag is already set — checked first,
    // since a plain addEventListener here would otherwise wait forever for
    // an event that already fired before this listener could exist. The
    // event stays too, as a fallback for the reverse order. Pages with no
    // .post-body (the homepage, archive pages) never load pgn-detect.js at
    // all, so they run immediately instead of waiting on either.
    if (!document.querySelector('.post-body')) {
        run();
    } else if (window.satranckahvesiPgnTagsReady) {
        run();
    } else {
        document.addEventListener('satranckahvesi:pgn-tags-ready', run, { once: true });
    }
})();

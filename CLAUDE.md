# Satranç vs. (satranckahvesi.github.io)

React + Vite + Tailwind site, deployed to GitHub Pages from `main` (`.github/workflows/deploy.yml`) at the root of
https://satranckahvesi.com. Articles live in `src/data/articles.json` (metadata) and `src/content/*.md` (body).

## Read this before touching chess rendering
**`docs/chesspublica-quirks.md`** documents the undocumented ChessPublica behavior the old site (`satranckahvesi-eski`)
had to work around. Read it before changing anything that involves ChessPublica: `public/chesspublica/*` (a patched local
copy of the bundle), `src/lib/chesspublica.ts`, game rendering in `src/components/ArticleBody.tsx`, or the diagram/comment
CSS in `src/site.css`. The note at the top of that file lists how this site differs from the old one.

## Ported from the old Jekyll site (`satranckahvesi-eski`)
- `scripts/send-push.mjs`, `scripts/push/apps-script.gs`: new-article web-push notifications. Only these two are ported so
  far; the browser side (service worker, subscribe UI), the GitHub Action and the setup README still live in the old repo.
  Config is `push.config.json` (empty until notifications are set up).
- `src/lib/curly.js` (+ `tests/curly.test.js`) and `src/lib/curly-dom.ts`: curly quotes, em dashes and "1/2" → "½" for
  article prose and PGN comments (never move text). Run the tests with `pnpm test`.
- Still to port if wanted: `scripts/check_content_links.rb`, `scripts/build-assets.mjs` (Jekyll-specific), other tests.
- `<pgn-player>` (puzzle view): `public/chesspublica/pgn-player.js` + `helpers.js`, `pgn.js`, `icons.js`, `board.js` are copied verbatim from ChessPublica's `assets/`; the bundle's own `<pgn-player>` definition was removed so the module can define it. Games with a `[P]`/`[Pn]` comment render as `<pgn-player>` (`PgnGame` in `ArticleBody.tsx`), others as `<pgn>`.
- `src/lib/localize-dom.ts` (port of the old `localize.js`): translates the player's hardcoded English UI strings (puzzle hint, "show solution", settings buttons). If ChessPublica changes those strings or class names (`.puzzle-hint-text`, `.puzzle-hint-btn`), update it. The old "Puzzle solved!" patch is not ported: this `pgn-player.js` has no such string.
- Article photos use `src/components/ProgressiveImage.tsx` (blurred LQIP + reserved space, fades in on load). Sizes and placeholders live in `src/data/image-meta.json`; after adding a photo to `public/images/` run `python3 scripts/image-placeholders.py` (Pillow).
- `src/lib/inline-play.ts`: moves the player's comment play button into the last line of the comment text (inline). Comments with variations keep it below. Depends on `.video-comment > .comment-play-btn` and `.comment-body` in `pgn-player.js`.
- Book covers live in `public/images/` with `adventurous-way` in the name are shown small and in color (`cover` mode in `ProgressiveImage`/`Figure`); other photos are grayscale.
- Game titles: ChessPublica's own title blocks (`.video-title`, `.pgn-headers`) are hidden; `GameSection` in `ArticleBody.tsx` shows only the round heading (round, players, result); the event/date line was removed on request.

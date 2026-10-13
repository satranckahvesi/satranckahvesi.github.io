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

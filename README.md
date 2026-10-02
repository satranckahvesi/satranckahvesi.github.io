# Satranç Kahvesi

Jekyll site ([satranckahvesi.github.io](https://satranckahvesi.github.io)), built by GitHub Pages.

## Writing a post

Create `_posts/YYYY-MM-DD-title-slug.md`. The date and slug must match the front matter `date` and `title`
(apostrophes dropped, Turkish letters transliterated: `Zürih 1953 Adaylar Turnuvası'ndan` becomes
`zurih-1953-adaylar-turnuvasindan`). Required front matter: `layout: post`, `title`, `date`, `author`,
`column`, `description`. `author` and `column` must match the `archive_value` of a page under
`yazarlar/` or `koseler/`. `bundle exec ruby scripts/check_content_links.rb` checks all of this.

Images need `width` and `height` (natural pixel size) so lazy-loaded images reserve their space:
`![alt](…){: loading="lazy" width="540" height="960"}`.

Posts dated in the future are not published until that date.

## Code

Sources are in `_js/` and `_css/`; `assets/js` and `assets/css` are generated and committed, because GitHub
Pages only runs Jekyll.

```sh
npm ci
npm run build          # regenerate assets/js and assets/css
npm run lint && npm test
bundle install
bundle exec jekyll serve
```

CI fails when the committed bundles are stale. Why the scripts patch ChessPublica the way they do is
documented in [docs/chesspublica-quirks.md](docs/chesspublica-quirks.md).

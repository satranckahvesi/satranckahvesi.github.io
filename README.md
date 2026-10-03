# Satranç Kahvesi

Jekyll site ([satranckahvesi.com](https://satranckahvesi.com)), built by GitHub Pages.

## Writing a post

Create `_posts/YYYY-MM-DD-title-slug.md`. The date and slug must match the front matter `date` and `title`
(apostrophes dropped, Turkish letters transliterated: `Zürih 1953 Adaylar Turnuvası'ndan` becomes
`zurih-1953-adaylar-turnuvasindan`). Required front matter: `layout: post`, `title`, `date`, `author`,
`column`. `author` and `column` must match the `archive_value` of a page under
`yazarlar/` or `koseler/`. `bundle exec ruby scripts/check_content_links.rb` checks all of this.

Image sizes need no attributes: the site reads each image's size from the file so lazy images reserve their space.

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

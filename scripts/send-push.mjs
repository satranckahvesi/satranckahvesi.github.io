#!/usr/bin/env node
// Sends a "new article" notification to every subscriber. Meant to run from a GitHub Action after a push to
// main that adds an entry to src/data/articles.json.
//
//   node scripts/send-push.mjs --since <commit>   notify for articles added since <commit>
//   node scripts/send-push.mjs --slug <slug>      notify for that article (manual test)
//   add --dry-run to print what would be sent
//   add --config <file> to read the settings from another file (default: push.config.json)
//
// Environment: PUSH_ADMIN_SECRET, VAPID_PRIVATE_KEY. The Apps Script URL (endpoint), the VAPID public key and
// the site URL come from push.config.json. Exits quietly when notifications are not configured yet.
//
// Ported from satranckahvesi-eski (Jekyll). Differences: articles come from src/data/articles.json instead of
// _posts/, the URL is /<slug>/ instead of /posts/<slug>/, and there is no publish date to wait for.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import webpush from 'web-push';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ARTICLES_FILE = 'src/data/articles.json';

// Same list as ALLOWED_HOSTS in scripts/push/apps-script.gs.
const ALLOWED_HOSTS = [
  /(^|\.)googleapis\.com$/,
  /(^|\.)push\.services\.mozilla\.com$/,
  /(^|\.)notify\.windows\.com$/,
  /(^|\.)push\.apple\.com$/
];

export function isAllowedEndpoint(endpoint) {
  try {
    const url = new URL(endpoint);
    return url.protocol === 'https:' && ALLOWED_HOSTS.some((pattern) => pattern.test(url.hostname));
  } catch {
    return false;
  }
}

// Articles are served at /<slug>/ (see articlePath in src/data/articles.ts).
export const articlePath = (slug) => `/${slug}/`;

// Articles in `after` whose slug is not in `before`. When `before` is unknown (the file did not exist at the
// base commit) nothing is announced, so the first run never notifies about every existing article.
export function newArticles(before, after) {
  if (!Array.isArray(before) || !Array.isArray(after)) return [];
  // `draft: true` yazılar henüz yayımlanmamıştır; taslak olmaktan çıktıkları gün "yeni" sayılırlar.
  const known = new Set(before.filter((article) => !article.draft).map((article) => article.slug));
  return after.filter((article) => article.slug && !article.draft && !known.has(article.slug));
}

function articlesAt(commit) {
  try {
    const source = execFileSync('git', ['show', `${commit}:${ARTICLES_FILE}`], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    return JSON.parse(source);
  } catch {
    return null;
  }
}

const currentArticles = () => JSON.parse(readFileSync(resolve(root, ARTICLES_FILE), 'utf8'));

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

async function waitUntilLive(url) {
  for (let attempt = 0; attempt < 45; attempt++) {
    try {
      const response = await fetch(url, { redirect: 'follow' });
      if (response.ok) return true;
    } catch {
      // Not reachable yet.
    }
    await sleep(20000);
  }
  return false;
}

async function call(endpoint, payload) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!result.ok) throw new Error(`Apps Script: ${result.error ?? response.status}`);
  return result;
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index > -1 ? process.argv[index + 1] : undefined;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const config = JSON.parse(readFileSync(resolve(root, option('--config') ?? 'push.config.json'), 'utf8'));
  const endpoint = config.endpoint;
  const publicKey = config.public_key;
  const secret = process.env.PUSH_ADMIN_SECRET;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!endpoint || !publicKey || !secret || !privateKey) {
    console.log('Notifications are not configured yet (endpoint, keys or secrets missing); nothing to do.');
    return;
  }

  const now = currentArticles();
  let articles;
  const manual = option('--slug');
  if (manual) {
    const found = now.find((article) => article.slug === manual);
    if (!found) {
      console.error(`--slug: no article with slug "${manual}" in ${ARTICLES_FILE}.`);
      process.exit(1);
    }
    articles = [found];
  } else {
    const since = option('--since');
    if (!since || /^0+$/.test(since)) {
      articles = [];
    } else {
      const before = articlesAt(since);
      if (before === null) console.log(`${ARTICLES_FILE} not readable at ${since}; nothing to announce (use --slug for a manual send).`);
      articles = newArticles(before, now);
    }
  }
  if (articles.length === 0) {
    console.log('No new articles to announce.');
    return;
  }

  const { subscriptions } = await call(endpoint, { action: 'list', secret });
  const targets = subscriptions.filter((subscription) => isAllowedEndpoint(subscription.endpoint));
  console.log(`${targets.length} subscriber(s), ${articles.length} article(s).`);

  const site = String(config.url).replace(/\/$/, '');
  webpush.setVapidDetails(site, publicKey, privateKey);

  for (const article of articles) {
    const url = site + articlePath(article.slug);
    const title = article.title ?? article.slug;
    if (dryRun) {
      console.log(`[dry run] ${title} -> ${url}`);
      continue;
    }
    if (!(await waitUntilLive(url))) {
      console.error(`${url} did not go live in time; not notifying.`);
      process.exitCode = 1;
      continue;
    }
    const message = JSON.stringify({ title: config.site_name ?? 'Satranç vs.', body: `Yeni yazı: ${title}`, url });
    const gone = [];
    let sent = 0;
    for (const subscription of targets) {
      try {
        // "high" asks Android to deliver at once instead of holding the message while the phone dozes.
        await webpush.sendNotification(subscription, message, { TTL: 60 * 60 * 24, urgency: 'high' });
        sent++;
      } catch (error) {
        // 404/410: the browser dropped the subscription for good.
        if (error.statusCode === 404 || error.statusCode === 410) gone.push(subscription.endpoint);
        else console.error(`Failed (${error.statusCode ?? error.code ?? 'error'}) for one subscriber.`);
      }
    }
    console.log(`${title}: ${sent} sent, ${gone.length} expired.`);
    if (gone.length) await call(endpoint, { action: 'remove', secret, endpoints: gone });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

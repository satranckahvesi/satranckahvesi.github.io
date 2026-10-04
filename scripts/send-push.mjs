#!/usr/bin/env node
// Sends a "new post" notification to every subscriber. Run by
// .github/workflows/notify.yml after a push to main that adds files to _posts/.
//
//   node scripts/send-push.mjs --since <commit>   notify for posts added since <commit>
//   node scripts/send-push.mjs --file _posts/x.md notify for that post (manual test)
//   add --dry-run to print what would be sent
//
// Environment: PUSH_ADMIN_SECRET, VAPID_PRIVATE_KEY. The Apps Script URL, the VAPID
// public key and the site URL come from _config.yml. Exits quietly when notifications
// are not configured yet.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import webpush from 'web-push';
import { parse } from 'yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

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

// _posts/2026-09-20-once-hamle-yap-sonra-dusun.md -> { date: '2026-09-20', slug: 'once-hamle-yap-sonra-dusun' }
export function parsePostFilename(file) {
  const match = /^(\d{4}-\d{2}-\d{2})-(.+)\.(?:md|markdown|html)$/.exec(basename(file));
  return match ? { date: match[1], slug: match[2] } : null;
}

export const postPath = (slug) => `/posts/${slug}/`;

export function frontMatterTitle(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
  const title = match ? parse(match[1])?.title : null;
  return typeof title === 'string' && title.trim() ? title.trim() : null;
}

// The date part of the file name is a calendar day in Istanbul; Jekyll skips posts dated in the future.
export const isPublishedBy = (date, today) => date <= today;

const istanbulToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date());

function newPosts(since) {
  if (!since || /^0+$/.test(since)) return [];
  const out = execFileSync('git', ['diff', '--name-only', '--diff-filter=A', since, 'HEAD', '--', '_posts/'], {
    cwd: root,
    encoding: 'utf8'
  });
  return out.split('\n').filter(Boolean);
}

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
  const config = parse(readFileSync(resolve(root, '_config.yml'), 'utf8'));
  const endpoint = config.push?.endpoint;
  const publicKey = config.push?.public_key;
  const secret = process.env.PUSH_ADMIN_SECRET;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!endpoint || !publicKey || !secret || !privateKey) {
    console.log('Notifications are not configured yet (endpoint, keys or secrets missing); nothing to do.');
    return;
  }

  const manual = option('--file');
  if (manual && !/^_posts\/[^/]+$/.test(manual)) {
    console.error('--file must be a post directly inside _posts/.');
    process.exit(1);
  }
  const files = manual ? [manual] : newPosts(option('--since'));
  const today = istanbulToday();
  const posts = [];
  for (const file of files) {
    const info = parsePostFilename(file);
    if (!info || !existsSync(resolve(root, file))) continue;
    if (!manual && !isPublishedBy(info.date, today)) {
      console.log(`${file}: dated in the future, skipped.`);
      continue;
    }
    const title = frontMatterTitle(readFileSync(resolve(root, file), 'utf8'));
    posts.push({ file, path: postPath(info.slug), title: title ?? info.slug });
  }
  if (posts.length === 0) {
    console.log('No new posts to announce.');
    return;
  }

  const { subscriptions } = await call(endpoint, { action: 'list', secret });
  const targets = subscriptions.filter((subscription) => isAllowedEndpoint(subscription.endpoint));
  console.log(`${targets.length} subscriber(s), ${posts.length} post(s).`);

  const site = String(config.url).replace(/\/$/, '');
  webpush.setVapidDetails(site, publicKey, privateKey);

  for (const post of posts) {
    const url = site + post.path;
    if (dryRun) {
      console.log(`[dry run] ${post.title} -> ${url}`);
      continue;
    }
    if (!(await waitUntilLive(url))) {
      console.error(`${url} did not go live in time; not notifying.`);
      process.exitCode = 1;
      continue;
    }
    const message = JSON.stringify({ title: 'Satranç Kahvesi', body: `Yeni yazı: ${post.title}`, url });
    const gone = [];
    let sent = 0;
    for (const subscription of targets) {
      try {
        await webpush.sendNotification(subscription, message, { TTL: 60 * 60 * 24 });
        sent++;
      } catch (error) {
        // 404/410: the browser dropped the subscription for good.
        if (error.statusCode === 404 || error.statusCode === 410) gone.push(subscription.endpoint);
        else console.error(`Failed (${error.statusCode ?? error.code ?? 'error'}) for one subscriber.`);
      }
    }
    console.log(`${post.title}: ${sent} sent, ${gone.length} expired.`);
    if (gone.length) await call(endpoint, { action: 'remove', secret, endpoints: gone });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

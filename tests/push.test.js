import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isAndroidUa, isIosDevice } from '../_js/lib/platform.js';
import { urlBase64ToBytes } from '../_js/push.js';
import { frontMatterTitle, isAllowedEndpoint, isPublishedBy, parsePostFilename, postPath } from '../scripts/send-push.mjs';

test('VAPID keys decode from base64url to bytes', () => {
  assert.deepEqual([...urlBase64ToBytes('AQID')], [1, 2, 3]);
  assert.deepEqual([...urlBase64ToBytes('-_8')], [251, 255]);
});

test('Android and iOS are told apart', () => {
  assert.equal(isAndroidUa('Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120 Mobile Safari/537.36'), true);
  assert.equal(isAndroidUa('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120'), false);
  assert.equal(isIosDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 'iPhone', 5), true);
  assert.equal(isIosDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 5), true);
  assert.equal(isIosDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 0), false);
});

test('only known push services are accepted as endpoints', () => {
  assert.equal(isAllowedEndpoint('https://fcm.googleapis.com/fcm/send/abc'), true);
  assert.equal(isAllowedEndpoint('https://updates.push.services.mozilla.com/wpush/v2/abc'), true);
  assert.equal(isAllowedEndpoint('https://wns2-par02p.notify.windows.com/w/?token=abc'), true);
  assert.equal(isAllowedEndpoint('http://fcm.googleapis.com/fcm/send/abc'), false);
  assert.equal(isAllowedEndpoint('https://evil.example.com/fcm.googleapis.com'), false);
  assert.equal(isAllowedEndpoint('https://googleapis.com.evil.example/x'), false);
  assert.equal(isAllowedEndpoint('not a url'), false);
});

test('post file names give the date, slug and URL', () => {
  const info = parsePostFilename('_posts/2026-09-20-once-hamle-yap-sonra-dusun.md');
  assert.deepEqual(info, { date: '2026-09-20', slug: 'once-hamle-yap-sonra-dusun' });
  assert.equal(postPath(info.slug), '/posts/once-hamle-yap-sonra-dusun/');
  assert.equal(parsePostFilename('_posts/README.md'), null);
});

test('titles come from the front matter', () => {
  assert.equal(frontMatterTitle('---\nlayout: post\ntitle: "Önce hamle yap sonra düşün"\n---\nMetin'), 'Önce hamle yap sonra düşün');
  assert.equal(frontMatterTitle("---\ntitle: Aronian'dan ders\n---\n"), "Aronian'dan ders");
  assert.equal(frontMatterTitle('Başlıksız metin'), null);
});

test('future-dated posts are not announced', () => {
  assert.equal(isPublishedBy('2026-10-04', '2026-10-04'), true);
  assert.equal(isPublishedBy('2026-10-05', '2026-10-04'), false);
});

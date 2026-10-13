import assert from 'node:assert/strict';
import { test } from 'node:test';
import { articlePath, isAllowedEndpoint, newArticles } from '../scripts/send-push.mjs';

test('only known push services are accepted as endpoints', () => {
  assert.equal(isAllowedEndpoint('https://fcm.googleapis.com/fcm/send/abc'), true);
  assert.equal(isAllowedEndpoint('https://updates.push.services.mozilla.com/wpush/v2/abc'), true);
  assert.equal(isAllowedEndpoint('https://wns2-par02p.notify.windows.com/w/?token=abc'), true);
  assert.equal(isAllowedEndpoint('http://fcm.googleapis.com/fcm/send/abc'), false);
  assert.equal(isAllowedEndpoint('https://evil.example.com/fcm.googleapis.com'), false);
  assert.equal(isAllowedEndpoint('https://googleapis.com.evil.example/x'), false);
  assert.equal(isAllowedEndpoint('not a url'), false);
});

test('articles are served at /<slug>/', () => {
  assert.equal(articlePath('mar-del-plata-1982-jan-timman-ve-bir-zaferin-anatomisi'), '/mar-del-plata-1982-jan-timman-ve-bir-zaferin-anatomisi/');
});

test('only articles added since the base commit are announced', () => {
  const before = [{ slug: 'a', title: 'A' }, { slug: 'b', title: 'B' }];
  const after = [...before, { slug: 'c', title: 'C' }];
  assert.deepEqual(newArticles(before, after).map((article) => article.slug), ['c']);
  assert.deepEqual(newArticles(after, after), []);
});

test('nothing is announced when the base file is unknown', () => {
  assert.deepEqual(newArticles(null, [{ slug: 'a', title: 'A' }]), []);
  assert.deepEqual(newArticles(undefined, []), []);
});

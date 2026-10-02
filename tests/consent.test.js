import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isGaCookie } from '../_js/consent.js';

test('GA4 cookies are recognised, other cookies are left alone', () => {
  assert.equal(isGaCookie('_ga'), true);
  assert.equal(isGaCookie('_ga_EQR45VG5M7'), true);
  assert.equal(isGaCookie('_gat'), false);
  assert.equal(isGaCookie('session'), false);
  assert.equal(isGaCookie('ga'), false);
});

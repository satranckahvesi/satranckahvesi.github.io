import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toCurly, toEmDashes } from '../_js/text/curly.js';

test('apostrophes close, quotes open after whitespace and brackets', () => {
  assert.equal(toCurly("İstanbul'da"), 'İstanbul’da');
  assert.equal(toCurly('"merhaba" dedi'), '“merhaba” dedi');
  assert.equal(toCurly("'tek' (\"çift\")"), '‘tek’ (“çift”)');
});

test('"--" becomes an em dash when glued to a word', () => {
  assert.equal(toEmDashes('getiren-- artık'), 'getiren— artık');
  assert.equal(toEmDashes('--Kasparov'), '—Kasparov');
});

test('a standalone "--" (PGN null move) and longer hyphen runs are left alone', () => {
  assert.equal(toEmDashes('1. e4 -- 2. d4'), '1. e4 -- 2. d4');
  assert.equal(toEmDashes('a---b'), 'a---b');
});

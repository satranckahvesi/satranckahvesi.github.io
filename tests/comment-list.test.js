import assert from 'node:assert/strict';
import { test } from 'node:test';
import { splitListItems } from '../_js/text/comment-list.js';

test('consecutive numbered comments are split into one piece per item', () => {
  assert.deepEqual(
    splitListItems('4... d6 Siyah merkezi sağlam tutuyor. 1- Birinci madde 2- İkinci madde 3- Üçüncü madde'),
    ['4... d6 Siyah merkezi sağlam tutuyor.', '1- Birinci madde', '2- İkinci madde', '3- Üçüncü madde']
  );
});

test('a list at the very start of the text is split too', () => {
  assert.deepEqual(splitListItems('1- A 2- B'), ['1- A', '2- B']);
});

test('a single item, or numbers that do not count up from 1, are not a list', () => {
  assert.deepEqual(splitListItems('Bkz. 1- tek madde'), ['Bkz. 1- tek madde']);
  assert.deepEqual(splitListItems('2- A 3- B'), ['2- A 3- B']);
});

test('game results, move numbers and ordinary hyphens are left alone', () => {
  for (const text of ['1-0', '1. e4 e5 2. Nf3', '1... e5 2... Nc6', 'Kara-Beyaz 1-2 oranı', '10-2 3-1']) {
    assert.deepEqual(splitListItems(text), [text]);
  }
});

test('splitting is idempotent: an item alone gives no further breaks', () => {
  assert.deepEqual(splitListItems('1- Birinci madde'), ['1- Birinci madde']);
  assert.deepEqual(splitListItems('2- İkinci madde'), ['2- İkinci madde']);
});

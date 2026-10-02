import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parseImageSize } from '../_js/lib/image-size.js';

const read = (path) => new Uint8Array(readFileSync(new URL(`../${path}`, import.meta.url)));

test('reads the real JPEGs in the repo', () => {
  assert.deepEqual(parseImageSize(read('assets/img/whitsun/salon.jpg')), { width: 540, height: 960 });
  assert.deepEqual(parseImageSize(read('assets/img/timman/book-cover.jpg')), { width: 329, height: 499 });
  assert.deepEqual(parseImageSize(read('assets/img/tarta/Ksawery_Tartakower.jpg')), { width: 204, height: 290 });
});

test('a truncated file gives null until the size marker is present', () => {
  const bytes = read('assets/img/whitsun/salon.jpg');
  assert.equal(parseImageSize(bytes.subarray(0, 3)), null);
  assert.deepEqual(parseImageSize(bytes.subarray(0, 4096)), { width: 540, height: 960 });
});

test('PNG, GIF and WebP headers', () => {
  const png = new Uint8Array(24);
  png.set([0x89, 0x50, 0x4e, 0x47]);
  png.set([0, 0, 1, 0x2c], 16); // 300
  png.set([0, 0, 0, 0x64], 20); // 100
  assert.deepEqual(parseImageSize(png), { width: 300, height: 100 });

  const gif = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x0a, 0, 0x14, 0]);
  assert.deepEqual(parseImageSize(gif), { width: 10, height: 20 });

  const webp = new Uint8Array(30);
  webp.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x58]);
  webp.set([0x63, 0x01, 0x00], 24); // 355 - 1 = width 356
  webp.set([0xc7, 0x00, 0x00], 27); // height 200
  assert.deepEqual(parseImageSize(webp), { width: 356, height: 200 });
});

test('EXIF rotation swaps the size', () => {
  const exif = [0xff, 0xe1, 0x00, 0x22, 0x45, 0x78, 0x69, 0x66, 0, 0, 0x4d, 0x4d, 0, 0x2a, 0, 0, 0, 8, 0, 1, 0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, 6, 0, 0, 0, 0, 0, 0];
  const sof = [0xff, 0xc0, 0, 0x0b, 8, 0, 0x64, 0, 0xc8, 1, 1, 0x11, 0]; // 200 wide x 100 high
  assert.deepEqual(parseImageSize(new Uint8Array([0xff, 0xd8, ...exif, ...sof])), { width: 100, height: 200 });
  assert.deepEqual(parseImageSize(new Uint8Array([0xff, 0xd8, ...sof])), { width: 200, height: 100 });
});

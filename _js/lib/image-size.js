// Finds an image's pixel size from the first bytes of the file, so the page can
// reserve its space before a lazy image loads, without the authors having to
// write width/height.

const MAX_BYTES = 262144; // a JPEG's size marker can sit behind a large EXIF block

const be16 = (b, i) => (b[i] << 8) | b[i + 1];
const le16 = (b, i) => b[i] | (b[i + 1] << 8);
const be32 = (b, i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
const ascii = (b, i, n) => String.fromCharCode(...b.subarray(i, i + n));

// EXIF orientation 5-8 means the browser displays the image rotated a quarter turn.
function exifOrientation(b, start, end) {
  if (ascii(b, start, 4) !== 'Exif') return 1;
  const tiff = start + 6;
  const little = ascii(b, tiff, 2) === 'II';
  const u16 = (i) => (little ? le16(b, i) : be16(b, i));
  const u32 = (i) => (little ? (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0 : be32(b, i));
  const ifd = tiff + u32(tiff + 4);
  if (ifd + 2 > end) return 1;
  const count = u16(ifd);
  for (let n = 0; n < count; n++) {
    const entry = ifd + 2 + n * 12;
    if (entry + 12 > end) return 1;
    if (u16(entry) === 0x0112) return u16(entry + 8);
  }
  return 1;
}

function jpegSize(b) {
  let orientation = 1;
  let i = 2;
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = b[i + 1];
    if (marker === 0xff) {
      i++;
      continue;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      i += 2;
      continue;
    }
    const length = be16(b, i + 2);
    if (marker === 0xe1 && i + 2 + length <= b.length) orientation = exifOrientation(b, i + 4, i + 2 + length);
    const isFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isFrame) {
      if (i + 9 > b.length) return null;
      const size = { width: be16(b, i + 7), height: be16(b, i + 5) };
      return orientation >= 5 ? { width: size.height, height: size.width } : size;
    }
    i += 2 + length;
  }
  return null;
}

function webpSize(b) {
  if (b.length < 30) return null;
  const kind = ascii(b, 12, 4);
  if (kind === 'VP8 ') return { width: le16(b, 26) & 0x3fff, height: le16(b, 28) & 0x3fff };
  if (kind === 'VP8L') {
    return {
      width: 1 + (((b[22] & 0x3f) << 8) | b[21]),
      height: 1 + (((b[24] & 0x0f) << 10) | (b[23] << 2) | ((b[22] & 0xc0) >> 6))
    };
  }
  if (kind === 'VP8X') {
    return {
      width: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)),
      height: 1 + (b[27] | (b[28] << 8) | (b[29] << 16))
    };
  }
  return null;
}

/**
 * @param {Uint8Array} bytes the start of an image file
 * @returns {{ width: number, height: number }|null} null when unknown or not enough bytes yet
 */
export function parseImageSize(bytes) {
  const b = bytes;
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) return jpegSize(b);
  if (b.length >= 24 && be32(b, 0) === 0x89504e47) return { width: be32(b, 16), height: be32(b, 20) };
  if (b.length >= 10 && ascii(b, 0, 3) === 'GIF') return { width: le16(b, 6), height: le16(b, 8) };
  if (b.length >= 12 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP') return webpSize(b);
  return null;
}

/** Reads just enough of `url` to learn the image size; resolves null on any failure. */
export async function probeImageSize(url, timeoutMs) {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: abort.signal });
    if (!response.ok || !response.body) return null;
    const reader = response.body.getReader();
    let bytes = new Uint8Array(0);
    while (bytes.length < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      const joined = new Uint8Array(bytes.length + value.length);
      joined.set(bytes);
      joined.set(value, bytes.length);
      bytes = joined;
      const size = parseImageSize(bytes);
      if (size) return size;
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    abort.abort(); // stop downloading the rest of the file
  }
}

/**
 * Server-side upload validation for the Manual MVP.
 *
 * Client-declared filenames and MIME types are never trusted. The accepted
 * MIME type is detected from file content (magic bytes) before an upload is
 * persisted.
 */

export const MVP_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB per image
export const MVP_MAX_FILES_PER_REQUEST = 10;
export const MVP_MAX_TITLE_LENGTH = 200;

export const MVP_ALLOWED_IMAGE_MIME_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
];

export const MVP_EXTENSION_BY_MIME: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

const HEIC_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis']);
const HEIF_BRANDS = new Set(['mif1', 'msf1', 'avif']);

/**
 * Detects a supported image MIME type from file signature (magic bytes).
 * Returns null when the content does not match any supported format.
 */
export function detectImageMimeType(buffer: Buffer): string | null {
  if (buffer.length < 12) {
    return null;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // GIF: "GIF87a" | "GIF89a"
  const gifHeader = buffer.toString('ascii', 0, 6);
  if (gifHeader === 'GIF87a' || gifHeader === 'GIF89a') {
    return 'image/gif';
  }

  // WebP: "RIFF"...."WEBP"
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  // HEIC/HEIF: ISO BMFF "ftyp" box with a known brand
  if (buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12).toLowerCase();
    if (HEIC_BRANDS.has(brand)) {
      return 'image/heic';
    }
    if (HEIF_BRANDS.has(brand)) {
      return 'image/heif';
    }
  }

  return null;
}

/** Keeps original filename as harmless metadata: no paths, no control chars. */
export function sanitizeOriginalFilename(filename: unknown): string {
  if (typeof filename !== 'string' || filename.trim() === '') {
    return 'unnamed';
  }

  const baseName = filename.split(/[\\/]/).pop() ?? 'unnamed';
  // eslint-disable-next-line no-control-regex
  const cleaned = baseName.replace(/[\u0000-\u001f\u007f]/g, '').trim();

  if (cleaned === '' || cleaned === '.' || cleaned === '..') {
    return 'unnamed';
  }

  return cleaned.slice(0, 200);
}

export function isSafeStorageKey(key: string): boolean {
  return (
    /^[A-Za-z0-9][A-Za-z0-9/_.-]*$/.test(key) &&
    !key.includes('..') &&
    !key.includes('//')
  );
}

import {
  detectImageMimeType,
  isSafeStorageKey,
  sanitizeOriginalFilename,
} from './mvp.validation';

function withHeader(bytes: number[], size = 32): Buffer {
  const buffer = Buffer.alloc(size);
  Buffer.from(bytes).copy(buffer);
  return buffer;
}

describe('detectImageMimeType (magic bytes)', () => {
  it('detects JPEG', () => {
    expect(detectImageMimeType(withHeader([0xff, 0xd8, 0xff, 0xe1]))).toBe(
      'image/jpeg',
    );
  });

  it('detects PNG', () => {
    expect(
      detectImageMimeType(
        withHeader([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
    ).toBe('image/png');
  });

  it('detects GIF', () => {
    const buffer = Buffer.alloc(32);
    buffer.write('GIF89a', 0, 'ascii');
    expect(detectImageMimeType(buffer)).toBe('image/gif');
  });

  it('detects WebP', () => {
    const buffer = Buffer.alloc(32);
    buffer.write('RIFF', 0, 'ascii');
    buffer.write('WEBP', 8, 'ascii');
    expect(detectImageMimeType(buffer)).toBe('image/webp');
  });

  it('detects HEIC', () => {
    const buffer = Buffer.alloc(32);
    buffer.write('ftyp', 4, 'ascii');
    buffer.write('heic', 8, 'ascii');
    expect(detectImageMimeType(buffer)).toBe('image/heic');
  });

  it('rejects unknown content', () => {
    expect(detectImageMimeType(Buffer.from('plain text, not an image'))).toBe(
      null,
    );
    expect(detectImageMimeType(Buffer.alloc(4))).toBe(null);
  });
});

describe('sanitizeOriginalFilename', () => {
  it('strips directory components', () => {
    expect(sanitizeOriginalFilename('..\\..\\a/b/photo.jpg')).toBe('photo.jpg');
  });

  it('handles empty and traversal-only names', () => {
    expect(sanitizeOriginalFilename('')).toBe('unnamed');
    expect(sanitizeOriginalFilename('..')).toBe('unnamed');
    expect(sanitizeOriginalFilename(undefined)).toBe('unnamed');
  });
});

describe('isSafeStorageKey', () => {
  it('accepts server-generated keys', () => {
    expect(isSafeStorageKey('albums/abc-123/originals/def-456.jpg')).toBe(true);
  });

  it('rejects traversal and absolute keys', () => {
    expect(isSafeStorageKey('../etc/passwd')).toBe(false);
    expect(isSafeStorageKey('albums/../secrets')).toBe(false);
    expect(isSafeStorageKey('/absolute/path')).toBe(false);
    expect(isSafeStorageKey('albums//double')).toBe(false);
  });
});

import {ImageAttachment, validateSelectedImage} from './ImageAttachment';
import {
  DEFAULT_IMAGE_CONSTRAINTS,
  detectImageMimeFromBytes,
  resolveImageMimeType,
} from './ImageConstraints';

describe('ImageAttachment / validation', () => {
  it('detects jpeg png and webp magic bytes', () => {
    expect(detectImageMimeFromBytes(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe(
      'image/jpeg',
    );
    expect(
      detectImageMimeFromBytes(
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
    ).toBe('image/png');
    expect(
      detectImageMimeFromBytes(
        new Uint8Array([
          0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
        ]),
      ),
    ).toBe('image/webp');
    expect(detectImageMimeFromBytes(new Uint8Array([0x00, 0x01, 0x02]))).toBeNull();
  });

  it('accepts valid jpeg metadata', () => {
    const result = ImageAttachment.create({
      url: 'https://cdn.example/abc.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 1024,
      width: 800,
      height: 600,
      sha256: 'a'.repeat(64),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.mimeType).toBe('image/jpeg');
    expect(result.value.width).toBe(800);
    expect(result.value.sha256).toBe('a'.repeat(64));
  });

  it('rejects bad MIME', () => {
    const result = ImageAttachment.create({
      url: 'https://cdn.example/x.gif',
      mimeType: 'image/gif',
      sizeBytes: 100,
      width: 10,
      height: 10,
    });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe('INVALID_IMAGE');
    expect(result.error.message).toMatch(/MIME/i);
  });

  it('rejects oversize', () => {
    const result = ImageAttachment.create({
      url: 'https://cdn.example/big.jpg',
      mimeType: 'image/png',
      sizeBytes: DEFAULT_IMAGE_CONSTRAINTS.maxBytes + 1,
      width: 100,
      height: 100,
    });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.message).toMatch(/max size/i);
  });

  it('rejects absurd dimensions on selected images', () => {
    const result = validateSelectedImage({
      uri: 'file:///tmp/x.jpg',
      mimeType: 'image/webp',
      sizeBytes: 1000,
      width: 9000,
      height: 100,
    });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.message).toMatch(/dimensions/i);
  });

  it('requires width and height for selected images', () => {
    const result = validateSelectedImage({
      uri: 'file:///tmp/x.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 1000,
    });
    expect(result.ok).toBe(false);
  });

  it('prefers client mime over octet-stream and aliases jpg', () => {
    expect(resolveImageMimeType('application/octet-stream', 'image/jpeg')).toBe('image/jpeg');
    expect(resolveImageMimeType('image/png', 'image/jpeg')).toBe('image/png');
    expect(resolveImageMimeType(undefined, 'image/jpg')).toBe('image/jpeg');
  });
});

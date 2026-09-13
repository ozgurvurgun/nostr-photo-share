import {ImageAttachment, validateSelectedImage} from './ImageAttachment';
import {DEFAULT_IMAGE_CONSTRAINTS, resolveImageMimeType} from './ImageConstraints';

describe('ImageAttachment / validation', () => {
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

import {sha256} from '@noble/hashes/sha2.js';
import {bytesToHex} from '../../../core/utilities/hex';
import {err, ok} from '../../../core/result/Result';
import type {IBlobHasher} from './ports/IBlobHasher';
import {UploadImageUseCase} from './UploadImageUseCase';
import type {IImageFileReader} from './ports/IImageFileReader';
import type {IImagePicker} from './ports/IImagePicker';
import type {
  IMediaUploader,
  MediaUploadRequest,
  MediaUploadResult,
} from './ports/IMediaUploader';
import {MediaUploadError} from '../domain/errors';
import type {SelectedImage} from '../domain/ImageAttachment';

const SAMPLE_BYTES = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
const SAMPLE_HASH = bytesToHex(sha256(SAMPLE_BYTES));

const selected: SelectedImage = {
  uri: 'file:///tmp/photo.jpg',
  mimeType: 'image/jpeg',
  sizeBytes: SAMPLE_BYTES.byteLength,
  width: 640,
  height: 480,
  fileName: 'photo.jpg',
};

function fakePicker(image: SelectedImage | null = selected): IImagePicker {
  return {
    async pickImage() {
      return ok(image);
    },
  };
}

function fakeReader(bytes: Uint8Array = SAMPLE_BYTES): IImageFileReader {
  return {
    async readBytes() {
      return ok(bytes);
    },
  };
}

class FakeMediaUploader implements IMediaUploader {
  readonly calls: MediaUploadRequest[] = [];
  fail = false;
  result: MediaUploadResult = {
    url: 'https://blossom.example/' + SAMPLE_HASH,
    sha256: SAMPLE_HASH,
    sizeBytes: SAMPLE_BYTES.byteLength,
    mimeType: 'image/jpeg',
  };

  async upload(request: MediaUploadRequest) {
    this.calls.push(request);
    request.onProgress?.(0.25);
    request.onProgress?.(0.75);
    if (this.fail) {
      return err(new MediaUploadError('uploader exploded'));
    }
    request.onProgress?.(1);
    return ok(this.result);
  }
}


const fakeHasher: IBlobHasher = {
  sha256Hex(bytes) {
    return bytesToHex(sha256(bytes));
  },
};

describe('UploadImageUseCase', () => {
  it('returns attachment with url on success', async () => {
    const uploader = new FakeMediaUploader();
    const useCase = new UploadImageUseCase(fakePicker(), fakeReader(), uploader, fakeHasher);
    const progress: number[] = [];

    const result = await useCase.execute({
      selected,
      onProgress: (p: number) => progress.push(p),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.url).toBe(uploader.result.url);
    expect(result.value.sha256).toBe(SAMPLE_HASH);
    expect(uploader.calls).toHaveLength(1);
    expect(uploader.calls[0]?.sha256).toBe(SAMPLE_HASH);
    expect(progress.length).toBeGreaterThan(0);
    expect(progress[progress.length - 1]).toBe(1);
  });

  it('does not invent a url when uploader fails', async () => {
    const uploader = new FakeMediaUploader();
    uploader.fail = true;
    const useCase = new UploadImageUseCase(fakePicker(), fakeReader(), uploader, fakeHasher);

    const result = await useCase.execute({selected});
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe('MEDIA_UPLOAD');
    expect(result.error.message).not.toMatch(/^https?:\/\//);
  });

  it('invokes progress callback via uploader', async () => {
    const uploader = new FakeMediaUploader();
    const useCase = new UploadImageUseCase(fakePicker(), fakeReader(), uploader, fakeHasher);
    const progress: number[] = [];

    await useCase.execute({
      selected,
      onProgress: (p: number) => progress.push(p),
    });

    expect(progress).toEqual([0.25, 0.75, 1]);
  });
});

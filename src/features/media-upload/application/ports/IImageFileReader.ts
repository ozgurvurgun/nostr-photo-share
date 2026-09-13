import type {Result} from '../../../../core/result/Result';
import type {ImageReadError} from '../../domain/errors';

export interface IImageFileReader {
  readBytes(uri: string): Promise<Result<Uint8Array, ImageReadError>>;
}

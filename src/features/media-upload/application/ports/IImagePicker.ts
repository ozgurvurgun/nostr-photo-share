import type {Result} from '../../../../core/result/Result';
import type {SelectedImage} from '../../domain/ImageAttachment';
import type {ImagePickerError} from '../../domain/errors';

export type PickImageOptions = {
  readonly selectionLimit?: number;
};

export interface IImagePicker {
  pickImage(options?: PickImageOptions): Promise<Result<SelectedImage | null, ImagePickerError>>;
}

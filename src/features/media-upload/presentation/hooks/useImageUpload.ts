import {useCallback, useState} from 'react';
import {useAppContainer} from '../../../../app/providers/AppContainerContext';
import type {ImageAttachment, SelectedImage} from '../../domain/ImageAttachment';

export type UploadUiState = 'idle' | 'picking' | 'uploading' | 'success' | 'error';

export type UseImageUploadResult = {
  readonly state: UploadUiState;
  readonly progress: number;
  readonly attachment: ImageAttachment | null;
  readonly localPreviewUri: string | null;
  readonly errorMessage: string | null;
  readonly pickAndUpload: () => Promise<ImageAttachment | null>;
  readonly uploadSelected: (selected: SelectedImage) => Promise<ImageAttachment | null>;
  readonly reset: () => void;
};

export function useImageUpload(): UseImageUploadResult {
  const container = useAppContainer();
  const [state, setState] = useState<UploadUiState>('idle');
  const [progress, setProgress] = useState(0);
  const [attachment, setAttachment] = useState<ImageAttachment | null>(null);
  const [localPreviewUri, setLocalPreviewUri] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reset = useCallback(() => {
    setState('idle');
    setProgress(0);
    setAttachment(null);
    setLocalPreviewUri(null);
    setErrorMessage(null);
  }, []);

  const uploadSelected = useCallback(
    async (selected: SelectedImage): Promise<ImageAttachment | null> => {
      setState('uploading');
      setProgress(0);
      setErrorMessage(null);
      setLocalPreviewUri(selected.uri);
      setAttachment(null);

      const result = await container.uploadImage.execute({
        selected,
        onProgress: value => {
          setProgress(Math.min(1, Math.max(0, value)));
        },
      });

      if (!result.ok) {
        setState('error');
        setErrorMessage(result.error.message);
        return null;
      }

      setAttachment(result.value);
      setProgress(1);
      setState('success');
      return result.value;
    },
    [container.uploadImage],
  );

  const pickAndUpload = useCallback(async (): Promise<ImageAttachment | null> => {
    setState('picking');
    setErrorMessage(null);
    setProgress(0);

    const picked = await container.imagePicker.pickImage();
    if (!picked.ok) {
      setState('error');
      setErrorMessage(picked.error.message);
      return null;
    }
    if (picked.value === null) {
      setState('idle');
      return null;
    }

    return uploadSelected(picked.value);
  }, [container.imagePicker, uploadSelected]);

  return {
    state,
    progress,
    attachment,
    localPreviewUri,
    errorMessage,
    pickAndUpload,
    uploadSelected,
    reset,
  };
}

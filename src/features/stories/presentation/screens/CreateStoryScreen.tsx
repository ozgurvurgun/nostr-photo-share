import React, {useMemo, useState} from 'react';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../../../../app/navigation/types';
import {StillHaptics} from '../../../../shared/haptics/haptics';
import {t} from '../../../../shared/i18n';
import {MediaStudioComposer} from '../../../../shared/ui/MediaStudioComposer';
import {MediaLightbox} from '../../../../shared/ui/MediaLightbox';
import {useToast} from '../../../../shared/ui/Toast';
import {useImageUpload} from '../../../media-upload/presentation/hooks/useImageUpload';
import {MAX_STORY_CAPTION_LENGTH} from '../../domain/Story';
import {usePublishStory} from '../hooks/useStories';

export type CreateStoryScreenProps = NativeStackScreenProps<AppStackParamList, 'CreateStory'>;

export function CreateStoryScreen({navigation}: CreateStoryScreenProps): React.JSX.Element {
  const upload = useImageUpload();
  const publish = usePublishStory();
  const toast = useToast();
  const [caption, setCaption] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const uploading = upload.state === 'picking' || upload.state === 'uploading';
  const hasImage = upload.state === 'success' && upload.attachment !== null;
  const canPublish = hasImage && !publish.isPending && !uploading;
  const previewUri = upload.localPreviewUri ?? upload.attachment?.url ?? null;

  async function onPick(): Promise<void> {
    setFormError(null);
    await upload.pickAndUpload();
  }

  async function onPublish(): Promise<void> {
    setFormError(null);
    if (!upload.attachment) {
      setFormError(t('createStory.needImage'));
      toast.show(t('createStory.needImage'), {tone: 'error'});
      return;
    }
    if (caption.trim().length > MAX_STORY_CAPTION_LENGTH) {
      const message = t('createStory.captionTooLong', {max: MAX_STORY_CAPTION_LENGTH});
      setFormError(message);
      toast.show(message, {tone: 'error'});
      return;
    }

    try {
      await publish.mutateAsync({
        attachment: upload.attachment,
        caption: caption.trim(),
      });
      StillHaptics.publishSuccess();
      toast.show(t('createStory.published'), {tone: 'success'});
      navigation.navigate('MainTabs', {screen: 'Home'});
    } catch (error) {
      StillHaptics.error();
      const message =
        error instanceof Error ? error.message : t('createStory.publishFailed');
      setFormError(message);
      toast.show(message, {tone: 'error'});
    }
  }

  const lightbox = useMemo(
    () => (
      <MediaLightbox
        uri={previewUri}
        visible={viewerOpen}
        onClose={() => setViewerOpen(false)}
        accessibilityLabel={t('createStory.previewA11y')}
      />
    ),
    [previewUri, viewerOpen],
  );

  return (
    <>
      <MediaStudioComposer
        previewUri={previewUri}
        caption={caption}
        onChangeCaption={setCaption}
        captionMaxLength={MAX_STORY_CAPTION_LENGTH}
        uploading={uploading}
        uploadProgress={upload.progress}
        publishing={publish.isPending}
        canPublish={canPublish}
        uploadError={upload.errorMessage}
        formError={formError}
        onClose={() => navigation.goBack()}
        onPick={() => {
          onPick().catch(() => undefined);
        }}
        onPublish={() => {
          onPublish().catch(() => undefined);
        }}
        onRetryUpload={() => {
          onPick().catch(() => undefined);
        }}
        onPreviewPress={() => setViewerOpen(true)}
      />
      {lightbox}
    </>
  );
}

import React, {useEffect, useRef, useState} from 'react';
import {Image, Pressable, ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../../../../app/navigation/types';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import {Button} from '../../../../shared/ui/Button';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {Icon} from '../../../../shared/ui/Icon';
import {TextField} from '../../../../shared/ui/TextField';
import {useImageUpload} from '../../../media-upload/presentation/hooks/useImageUpload';
import {
  MAX_IMAGE_POST_CAPTION_LENGTH,
  MAX_IMAGE_POST_TITLE_LENGTH,
} from '../../domain/ImagePost';
import {usePublishImagePost} from '../hooks/useFeed';

export type CreatePostScreenProps = NativeStackScreenProps<AppStackParamList, 'CreatePost'>;

type Step = 'pick' | 'compose';

export function CreatePostScreen({navigation}: CreatePostScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const upload = useImageUpload();
  const publish = usePublishImagePost();
  const [step, setStep] = useState<Step>('pick');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const autoAdvancedRef = useRef(false);

  const uploading = upload.state === 'picking' || upload.state === 'uploading';
  const hasImage = upload.state === 'success' && upload.attachment !== null;
  const canPublish = hasImage && !publish.isPending && !uploading;

  useEffect(() => {
    if (hasImage && step === 'pick' && !autoAdvancedRef.current) {
      autoAdvancedRef.current = true;
      setStep('compose');
    }
  }, [hasImage, step]);

  async function onPick(): Promise<void> {
    setFormError(null);
    await upload.pickAndUpload();
  }

  async function onPublish(): Promise<void> {
    setFormError(null);
    if (!upload.attachment) {
      setFormError(t('createPost.needImage'));
      return;
    }
    const trimmedTitle = title.trim();
    const trimmedCaption = caption.trim();
    const resolvedTitle =
      trimmedTitle.length > 0
        ? trimmedTitle
        : trimmedCaption.slice(0, MAX_IMAGE_POST_TITLE_LENGTH) ||
          t('createPost.defaultTitle');

    if (resolvedTitle.length > MAX_IMAGE_POST_TITLE_LENGTH) {
      setFormError(t('createPost.titleTooLong', {max: MAX_IMAGE_POST_TITLE_LENGTH}));
      return;
    }
    if (trimmedCaption.length > MAX_IMAGE_POST_CAPTION_LENGTH) {
      setFormError(t('createPost.captionTooLong', {max: MAX_IMAGE_POST_CAPTION_LENGTH}));
      return;
    }

    try {
      await publish.mutateAsync({
        title: resolvedTitle,
        caption: trimmedCaption,
        attachment: upload.attachment,
      });
      navigation.navigate('MainTabs', {screen: 'Home'});
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : t('createPost.publishFailed'),
      );
    }
  }

  function onBack(): void {
    if (step === 'compose') {
      autoAdvancedRef.current = true;
      setStep('pick');
      return;
    }
    navigation.goBack();
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background.primary,
        paddingTop: insets.top,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing.screenEdge,
          paddingVertical: theme.spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.default,
        }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            step === 'compose' ? t('createPost.backToPhoto') : t('common.close')
          }
          onPress={onBack}
          hitSlop={theme.layout.hitSlop}
          style={({pressed}) => ({opacity: pressed ? 0.7 : 1})}>
          <Icon
            name={step === 'compose' ? 'chevronLeft' : 'close'}
            size={24}
            color={theme.colors.text.primary}
          />
        </Pressable>
        <Text
          accessibilityRole="header"
          style={{
            color: theme.colors.text.primary,
            fontSize: theme.typography.heading.fontSize,
            fontWeight: theme.typography.heading.fontWeight,
          }}>
          {step === 'pick' ? t('createPost.stepPick') : t('createPost.stepShare')}
        </Text>
        {step === 'compose' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('createPost.publish')}
            disabled={!canPublish}
            onPress={() => {
              void onPublish();
            }}
            hitSlop={theme.layout.hitSlop}
            style={({pressed}) => ({
              opacity: !canPublish ? 0.4 : pressed ? 0.7 : 1,
            })}>
            <Text
              style={{
                color: theme.colors.accent.primary,
                fontSize: theme.typography.body.fontSize,
                fontWeight: '700',
              }}>
              {publish.isPending ? t('common.loading') : t('createPost.publish')}
            </Text>
          </Pressable>
        ) : (
          <View style={{width: 24}} />
        )}
      </View>

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.screenEdge,
          paddingTop: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.lg,
          gap: theme.spacing.md,
        }}
        keyboardShouldPersistTaps="handled">
        {step === 'pick' ? (
          <>
            <Text
              style={{
                color: theme.colors.text.secondary,
                fontSize: theme.typography.body.fontSize,
                lineHeight: theme.typography.body.lineHeight,
              }}>
              {t('createPost.body')}
            </Text>

            {(upload.localPreviewUri || upload.attachment) && (
              <Image
                accessibilityLabel={t('createPost.previewA11y')}
                source={{uri: upload.localPreviewUri ?? upload.attachment?.url}}
                style={{
                  width: '100%',
                  aspectRatio: 1,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.background.elevated,
                }}
                resizeMode="cover"
              />
            )}

            {upload.state === 'uploading' ? (
              <Text
                style={{
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.caption.fontSize,
                }}>
                {t('createPost.uploading', {percent: Math.round(upload.progress * 100)})}
              </Text>
            ) : null}

            {upload.errorMessage ? (
              <ErrorState
                title={t('createPost.uploadFailed')}
                message={upload.errorMessage}
                onRetry={() => {
                  void onPick();
                }}
              />
            ) : null}

            <Button
              label={
                upload.attachment ? t('createPost.replaceImage') : t('createPost.chooseImage')
              }
              loading={uploading}
              onPress={() => {
                void onPick();
              }}
            />
            {hasImage ? (
              <Button label={t('createPost.next')} onPress={() => setStep('compose')} />
            ) : null}
          </>
        ) : (
          <>
            <View style={{flexDirection: 'row', gap: theme.spacing.md}}>
              <Image
                accessibilityLabel={t('createPost.previewA11y')}
                source={{uri: upload.localPreviewUri ?? upload.attachment?.url}}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.colors.background.elevated,
                }}
                resizeMode="cover"
              />
              <View style={{flex: 1, gap: theme.spacing.sm}}>
                <TextField
                  label={t('createPost.captionLabel')}
                  value={caption}
                  onChangeText={setCaption}
                  maxLength={MAX_IMAGE_POST_CAPTION_LENGTH}
                  editable={!publish.isPending}
                  placeholder={t('createPost.captionPlaceholder')}
                  multiline
                  style={{
                    minHeight: theme.layout.captionMinHeight,
                    textAlignVertical: 'top',
                  }}
                />
              </View>
            </View>

            <TextField
              label={t('createPost.titleLabel')}
              value={title}
              onChangeText={setTitle}
              maxLength={MAX_IMAGE_POST_TITLE_LENGTH}
              editable={!publish.isPending}
              placeholder={t('createPost.titleOptionalPlaceholder')}
            />

            {upload.state === 'uploading' ? (
              <Text
                style={{
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.caption.fontSize,
                }}>
                {t('createPost.uploading', {percent: Math.round(upload.progress * 100)})}
              </Text>
            ) : null}

            {formError ? (
              <ErrorState title={t('createPost.publishFailed')} message={formError} />
            ) : null}

            <Button
              label={t('createPost.publish')}
              loading={publish.isPending}
              disabled={!canPublish}
              onPress={() => {
                void onPublish();
              }}
            />
            <Button
              label={t('createPost.replaceImage')}
              variant="secondary"
              disabled={publish.isPending}
              onPress={() => {
                autoAdvancedRef.current = false;
                setStep('pick');
                void onPick();
              }}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

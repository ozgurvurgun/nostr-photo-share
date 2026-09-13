import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Image, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../../../../app/navigation/types';
import {t} from '../../../../shared/i18n';
import {StillHaptics} from '../../../../shared/haptics/haptics';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {Button} from '../../../../shared/ui/Button';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {Icon} from '../../../../shared/ui/Icon';
import {MediaLightbox} from '../../../../shared/ui/MediaLightbox';
import {StepProgress} from '../../../../shared/ui/StepProgress';
import {TextField} from '../../../../shared/ui/TextField';
import {UploadProgressBar} from '../../../../shared/ui/UploadProgressBar';
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
  const styles = useMemo(
    () => createStyles(theme, insets.top, insets.bottom),
    [theme, insets.top, insets.bottom],
  );
  const upload = useImageUpload();
  const publish = usePublishImagePost();
  const [step, setStep] = useState<Step>('pick');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const autoAdvancedRef = useRef(false);

  const uploading = upload.state === 'picking' || upload.state === 'uploading';
  const hasImage = upload.state === 'success' && upload.attachment !== null;
  const canPublish = hasImage && !publish.isPending && !uploading;
  const previewUri = upload.localPreviewUri ?? upload.attachment?.url ?? null;

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
      StillHaptics.publishSuccess();
      navigation.navigate('MainTabs', {screen: 'Home'});
    } catch (error) {
      StillHaptics.error();
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
    <View style={styles.root}>
      <View style={styles.header}>
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
        <Text accessibilityRole="header" style={styles.headerTitle}>
          {step === 'pick' ? t('createPost.stepPick') : t('createPost.stepShare')}
        </Text>
        {step === 'compose' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('createPost.publish')}
            disabled={!canPublish}
            onPress={() => {
              onPublish().catch(() => undefined);
            }}
            hitSlop={theme.layout.hitSlop}
            style={({pressed}) => ({
              opacity: !canPublish ? 0.4 : pressed ? 0.7 : 1,
            })}>
            <Text style={styles.headerAction}>
              {publish.isPending ? t('common.loading') : t('createPost.publish')}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <StepProgress
          labels={[t('mediaUpload.stepPick'), t('createPost.stepShare')]}
          currentIndex={step === 'pick' ? 0 : 1}
        />

        {step === 'pick' ? (
          <>
            <Text style={styles.body}>{t('createPost.body')}</Text>

            {previewUri ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('mediaUpload.openViewerA11y')}
                onPress={() => setViewerOpen(true)}>
                <Image
                  accessibilityLabel={t('createPost.previewA11y')}
                  source={{uri: previewUri}}
                  style={styles.previewLarge}
                  resizeMode="cover"
                />
              </Pressable>
            ) : null}

            <UploadProgressBar
              progress={upload.progress}
              visible={upload.state === 'uploading'}
              label={t('createPost.uploading', {
                percent: Math.round(upload.progress * 100),
              })}
            />

            {upload.errorMessage ? (
              <ErrorState
                title={t('createPost.uploadFailed')}
                message={upload.errorMessage}
                onRetry={() => {
                  onPick().catch(() => undefined);
                }}
              />
            ) : null}

            <Button
              label={
                upload.attachment ? t('createPost.replaceImage') : t('createPost.chooseImage')
              }
              loading={uploading}
              onPress={() => {
                onPick().catch(() => undefined);
              }}
            />
            {hasImage ? (
              <Button label={t('createPost.next')} onPress={() => setStep('compose')} />
            ) : null}
          </>
        ) : (
          <>
            <View style={styles.composeRow}>
              {previewUri ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('mediaUpload.openViewerA11y')}
                  onPress={() => setViewerOpen(true)}>
                  <Image
                    accessibilityLabel={t('createPost.previewA11y')}
                    source={{uri: previewUri}}
                    style={styles.previewThumb}
                    resizeMode="cover"
                  />
                </Pressable>
              ) : null}
              <View style={styles.composeFields}>
                <TextField
                  label={t('createPost.captionLabel')}
                  value={caption}
                  onChangeText={setCaption}
                  maxLength={MAX_IMAGE_POST_CAPTION_LENGTH}
                  editable={!publish.isPending}
                  placeholder={t('createPost.captionPlaceholder')}
                  multiline
                  style={styles.captionField}
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

            <UploadProgressBar
              progress={upload.progress}
              visible={upload.state === 'uploading'}
              label={t('createPost.uploading', {
                percent: Math.round(upload.progress * 100),
              })}
            />

            {formError ? (
              <ErrorState title={t('createPost.publishFailed')} message={formError} />
            ) : null}

            <Button
              label={t('createPost.publish')}
              loading={publish.isPending}
              disabled={!canPublish}
              onPress={() => {
                onPublish().catch(() => undefined);
              }}
            />
            <Button
              label={t('createPost.replaceImage')}
              variant="secondary"
              disabled={publish.isPending}
              onPress={() => {
                autoAdvancedRef.current = false;
                setStep('pick');
                onPick().catch(() => undefined);
              }}
            />
          </>
        )}
      </ScrollView>

      <MediaLightbox
        uri={previewUri}
        visible={viewerOpen}
        onClose={() => setViewerOpen(false)}
        accessibilityLabel={t('createPost.previewA11y')}
      />
    </View>
  );
}

function createStyles(theme: Theme, insetTop: number, insetBottom: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
      paddingTop: insetTop,
    },
    flex: {flex: 1},
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.screenEdge,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.default,
    },
    headerTitle: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.heading.fontSize,
      fontWeight: theme.typography.heading.fontWeight,
    },
    headerAction: {
      color: theme.colors.accent.primary,
      fontSize: theme.typography.body.fontSize,
      fontWeight: '700',
    },
    headerSpacer: {width: 24},
    content: {
      paddingHorizontal: theme.spacing.screenEdge,
      paddingTop: theme.spacing.lg,
      paddingBottom: insetBottom + theme.spacing.lg,
      gap: theme.spacing.md,
    },
    body: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.body.fontSize,
      lineHeight: theme.typography.body.lineHeight,
    },
    previewLarge: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.background.elevated,
    },
    composeRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    previewThumb: {
      width: 96,
      height: 96,
      borderRadius: theme.radius.sm,
      backgroundColor: theme.colors.background.elevated,
    },
    composeFields: {
      flex: 1,
      gap: theme.spacing.sm,
    },
    captionField: {
      minHeight: theme.layout.captionMinHeight,
      textAlignVertical: 'top',
    },
  });
}

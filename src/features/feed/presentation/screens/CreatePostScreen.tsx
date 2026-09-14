import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../../../../app/navigation/types';
import {StillHaptics} from '../../../../shared/haptics/haptics';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {Icon} from '../../../../shared/ui/Icon';
import {KeyboardScreen} from '../../../../shared/ui/KeyboardScreen';
import {MediaLightbox} from '../../../../shared/ui/MediaLightbox';
import {UploadProgressBar} from '../../../../shared/ui/UploadProgressBar';
import {useToast} from '../../../../shared/ui/Toast';
import {useImageUpload} from '../../../media-upload/presentation/hooks/useImageUpload';
import {
  MAX_IMAGE_POST_CAPTION_LENGTH,
  MAX_IMAGE_POST_TITLE_LENGTH,
} from '../../domain/ImagePost';
import {usePublishImagePost} from '../hooks/useFeed';

export type CreatePostScreenProps = NativeStackScreenProps<AppStackParamList, 'CreatePost'>;

type Step = 'pick' | 'compose';

/**
 * Instagram-like new post flow: square gallery pick → caption compose → Share.
 * Intentionally separate from the story studio (canvas / stickers / effects).
 */
export function CreatePostScreen({navigation}: CreatePostScreenProps): React.JSX.Element {
  const theme = useTheme();
  const toast = useToast();
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
      toast.show(t('createPost.published'), {tone: 'success'});
      navigation.navigate('MainTabs', {screen: 'Home'});
    } catch (error) {
      StillHaptics.error();
      const message =
        error instanceof Error ? error.message : t('createPost.publishFailed');
      setFormError(message);
      toast.show(message, {tone: 'error'});
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
    <KeyboardScreen style={styles.root}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            step === 'compose' ? t('createPost.backToPhoto') : t('common.close')
          }
          onPress={() => {
            StillHaptics.selection();
            onBack();
          }}
          hitSlop={theme.layout.hitSlop}
          style={({pressed}) => [styles.headerSide, pressed ? styles.pressed : null]}>
          <Icon
            name={step === 'compose' ? 'chevronLeft' : 'close'}
            size={24}
            color={theme.colors.text.primary}
          />
        </Pressable>

        <Text accessibilityRole="header" style={styles.headerTitle}>
          {step === 'pick' ? t('createPost.stepPick') : t('createPost.title')}
        </Text>

        {step === 'pick' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('createPost.next')}
            disabled={!hasImage || uploading}
            onPress={() => {
              StillHaptics.selection();
              setStep('compose');
            }}
            hitSlop={theme.layout.hitSlop}
            style={({pressed}) => [
              styles.headerSideEnd,
              !hasImage || uploading ? styles.disabled : null,
              pressed ? styles.pressed : null,
            ]}>
            <Text style={styles.headerAction}>{t('createPost.next')}</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('createPost.publish')}
            disabled={!canPublish}
            onPress={() => {
              onPublish().catch(() => undefined);
            }}
            hitSlop={theme.layout.hitSlop}
            style={({pressed}) => [
              styles.headerSideEnd,
              !canPublish ? styles.disabled : null,
              pressed ? styles.pressed : null,
            ]}>
            <Text style={styles.headerAction}>
              {publish.isPending ? t('common.loading') : t('createPost.publish')}
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.flex}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        {step === 'pick' ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                previewUri ? t('createPost.previewA11y') : t('createPost.chooseImage')
              }
              disabled={uploading}
              onPress={() => {
                if (previewUri) {
                  setViewerOpen(true);
                  return;
                }
                onPick().catch(() => undefined);
              }}
              style={({pressed}) => [
                styles.squareStage,
                pressed ? styles.pressed : null,
              ]}>
              {previewUri ? (
                <Image
                  source={{uri: previewUri}}
                  style={styles.squareImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.squareEmpty}>
                  <Icon name="image" size={48} color={theme.colors.text.disabled} />
                  <Text style={styles.squareEmptyTitle}>
                    {t('createPost.pickPlaceholder')}
                  </Text>
                </View>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('createPost.chooseImage')}
              disabled={uploading}
              onPress={() => {
                StillHaptics.selection();
                onPick().catch(() => undefined);
              }}
              style={({pressed}) => [
                styles.galleryRow,
                pressed ? styles.pressed : null,
              ]}>
              <Icon name="image" size={20} color={theme.colors.text.primary} />
              <Text style={styles.galleryRowLabel}>
                {previewUri ? t('createPost.replaceImage') : t('createPost.chooseImage')}
              </Text>
              <Icon name="chevronRight" size={18} color={theme.colors.text.disabled} />
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.composeHero}>
              {previewUri ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('mediaUpload.openViewerA11y')}
                  onPress={() => setViewerOpen(true)}>
                  <Image
                    source={{uri: previewUri}}
                    style={styles.composeImage}
                    resizeMode="cover"
                  />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.captionRow}>
              {previewUri ? (
                <Image
                  source={{uri: previewUri}}
                  style={styles.thumb}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.thumb, styles.thumbFallback]} />
              )}
              <TextInput
                value={caption}
                onChangeText={setCaption}
                maxLength={MAX_IMAGE_POST_CAPTION_LENGTH}
                editable={!publish.isPending}
                placeholder={t('createPost.captionPlaceholder')}
                placeholderTextColor={theme.colors.text.disabled}
                multiline
                style={styles.captionInput}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>{t('createPost.titleLabel')}</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                maxLength={MAX_IMAGE_POST_TITLE_LENGTH}
                editable={!publish.isPending}
                placeholder={t('createPost.titleOptionalPlaceholder')}
                placeholderTextColor={theme.colors.text.disabled}
                style={styles.metaInput}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('createPost.replaceImage')}
              disabled={publish.isPending}
              onPress={() => {
                StillHaptics.selection();
                autoAdvancedRef.current = false;
                setStep('pick');
                onPick().catch(() => undefined);
              }}
              style={({pressed}) => [
                styles.galleryRow,
                pressed ? styles.pressed : null,
              ]}>
              <Icon name="camera" size={20} color={theme.colors.text.primary} />
              <Text style={styles.galleryRowLabel}>{t('createPost.replaceImage')}</Text>
              <Icon name="chevronRight" size={18} color={theme.colors.text.disabled} />
            </Pressable>
          </>
        )}

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
        {formError ? (
          <ErrorState title={t('createPost.publishFailed')} message={formError} />
        ) : null}
      </ScrollView>

      <MediaLightbox
        uri={previewUri}
        visible={viewerOpen}
        onClose={() => setViewerOpen(false)}
        accessibilityLabel={t('createPost.previewA11y')}
      />
    </KeyboardScreen>
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
      minHeight: 52,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.default,
    },
    headerSide: {
      width: 44,
      alignItems: 'flex-start',
      justifyContent: 'center',
    },
    headerSideEnd: {
      minWidth: 44,
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      color: theme.colors.text.primary,
      fontSize: theme.typography.heading.fontSize,
      fontWeight: '700',
    },
    headerAction: {
      color: theme.colors.accent.primary,
      fontSize: theme.typography.body.fontSize,
      fontWeight: '700',
    },
    content: {
      paddingBottom: insetBottom + theme.spacing.lg,
      gap: theme.spacing.md,
    },
    squareStage: {
      width: '100%',
      aspectRatio: 1,
      backgroundColor: theme.colors.background.secondary,
    },
    squareImage: {
      width: '100%',
      height: '100%',
    },
    squareEmpty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.background.elevated,
    },
    squareEmptyTitle: {
      color: theme.colors.text.disabled,
      fontWeight: '600',
    },
    galleryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      marginHorizontal: theme.spacing.screenEdge,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.default,
    },
    galleryRowLabel: {
      flex: 1,
      color: theme.colors.text.primary,
      fontSize: theme.typography.body.fontSize,
      fontWeight: '600',
    },
    composeHero: {
      width: '100%',
      aspectRatio: 1,
      backgroundColor: theme.colors.background.secondary,
    },
    composeImage: {
      width: '100%',
      height: '100%',
    },
    captionRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.screenEdge,
      paddingTop: theme.spacing.md,
    },
    thumb: {
      width: 56,
      height: 56,
      borderRadius: theme.radius.sm,
      backgroundColor: theme.colors.background.elevated,
    },
    thumbFallback: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.default,
    },
    captionInput: {
      flex: 1,
      minHeight: 56,
      maxHeight: 140,
      color: theme.colors.text.primary,
      fontSize: theme.typography.body.fontSize,
      lineHeight: theme.typography.body.lineHeight,
      textAlignVertical: 'top',
      padding: 0,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border.default,
      marginHorizontal: theme.spacing.screenEdge,
    },
    metaBlock: {
      paddingHorizontal: theme.spacing.screenEdge,
      gap: theme.spacing.xs,
    },
    metaLabel: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
      fontWeight: '600',
    },
    metaInput: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.body.fontSize,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.default,
    },
    pressed: {
      opacity: 0.75,
    },
    disabled: {
      opacity: 0.35,
    },
  });
}

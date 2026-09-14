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
import {KeyboardScreen} from '../../../../shared/ui/KeyboardScreen';
import {MediaLightbox} from '../../../../shared/ui/MediaLightbox';
import {StepProgress} from '../../../../shared/ui/StepProgress';
import {TextField} from '../../../../shared/ui/TextField';
import {UploadProgressBar} from '../../../../shared/ui/UploadProgressBar';
import {useImageUpload} from '../../../media-upload/presentation/hooks/useImageUpload';
import {MAX_STORY_CAPTION_LENGTH} from '../../domain/Story';
import {usePublishStory} from '../hooks/useStories';

export type CreateStoryScreenProps = NativeStackScreenProps<AppStackParamList, 'CreateStory'>;

type Step = 'pick' | 'compose';

export function CreateStoryScreen({navigation}: CreateStoryScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(theme, insets.top, insets.bottom),
    [theme, insets.top, insets.bottom],
  );
  const upload = useImageUpload();
  const publish = usePublishStory();
  const [step, setStep] = useState<Step>('pick');
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
      setFormError(t('createStory.needImage'));
      return;
    }
    if (caption.trim().length > MAX_STORY_CAPTION_LENGTH) {
      setFormError(t('createStory.captionTooLong', {max: MAX_STORY_CAPTION_LENGTH}));
      return;
    }

    try {
      await publish.mutateAsync({
        attachment: upload.attachment,
        caption: caption.trim(),
      });
      StillHaptics.publishSuccess();
      navigation.navigate('MainTabs', {screen: 'Home'});
    } catch (error) {
      StillHaptics.error();
      setFormError(
        error instanceof Error ? error.message : t('createStory.publishFailed'),
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
    <KeyboardScreen style={styles.root}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            step === 'compose' ? t('createStory.backToPhoto') : t('common.close')
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
          {step === 'pick' ? t('createStory.stepPick') : t('createStory.stepShare')}
        </Text>
        {step === 'compose' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('createStory.share')}
            disabled={!canPublish}
            onPress={() => {
              onPublish().catch(() => undefined);
            }}
            hitSlop={theme.layout.hitSlop}
            style={({pressed}) => ({
              opacity: !canPublish ? 0.4 : pressed ? 0.7 : 1,
            })}>
            <Text style={styles.headerAction}>
              {publish.isPending ? t('common.loading') : t('createStory.share')}
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
          labels={[t('mediaUpload.stepPick'), t('createStory.stepShare')]}
          currentIndex={step === 'pick' ? 0 : 1}
        />

        {step === 'pick' ? (
          <>
            <Text style={styles.body}>{t('createStory.body')}</Text>

            {previewUri ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('mediaUpload.openViewerA11y')}
                onPress={() => setViewerOpen(true)}>
                <Image
                  accessibilityLabel={t('createStory.previewA11y')}
                  source={{uri: previewUri}}
                  style={styles.previewLarge}
                  resizeMode="cover"
                />
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('createStory.chooseImage')}
                disabled={uploading}
                onPress={() => {
                  onPick().catch(() => undefined);
                }}
                style={({pressed}) => [
                  styles.pickPlaceholder,
                  pressed ? styles.pressed : null,
                ]}>
                <Icon name="image" size={40} color={theme.colors.text.disabled} />
                <Text style={styles.pickPlaceholderLabel}>
                  {t('createStory.pickPlaceholder')}
                </Text>
              </Pressable>
            )}

            <UploadProgressBar
              progress={upload.progress}
              visible={upload.state === 'uploading'}
              label={t('createStory.uploading', {
                percent: Math.round(upload.progress * 100),
              })}
            />

            {upload.errorMessage ? (
              <ErrorState
                title={t('createStory.uploadFailed')}
                message={upload.errorMessage}
                onRetry={() => {
                  onPick().catch(() => undefined);
                }}
              />
            ) : null}

            <Button
              label={
                upload.attachment
                  ? t('createStory.replaceImage')
                  : t('createStory.chooseImage')
              }
              loading={uploading}
              onPress={() => {
                onPick().catch(() => undefined);
              }}
            />
            {hasImage ? (
              <Button label={t('createStory.next')} onPress={() => setStep('compose')} />
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
                    accessibilityLabel={t('createStory.previewA11y')}
                    source={{uri: previewUri}}
                    style={styles.previewThumb}
                    resizeMode="cover"
                  />
                </Pressable>
              ) : null}
              <View style={styles.composeFields}>
                <TextField
                  label={t('createStory.captionLabel')}
                  value={caption}
                  onChangeText={setCaption}
                  maxLength={MAX_STORY_CAPTION_LENGTH}
                  editable={!publish.isPending}
                  placeholder={t('createStory.captionPlaceholder')}
                  multiline
                  style={styles.captionField}
                />
              </View>
            </View>

            <Text style={styles.hint}>{t('createStory.expiryHint')}</Text>

            <UploadProgressBar
              progress={upload.progress}
              visible={upload.state === 'uploading'}
              label={t('createStory.uploading', {
                percent: Math.round(upload.progress * 100),
              })}
            />

            {formError ? (
              <ErrorState title={t('createStory.publishFailed')} message={formError} />
            ) : null}

            <Button
              label={t('createStory.share')}
              loading={publish.isPending}
              disabled={!canPublish}
              onPress={() => {
                onPublish().catch(() => undefined);
              }}
            />
            <Button
              label={t('createStory.replaceImage')}
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
        accessibilityLabel={t('createStory.previewA11y')}
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
      aspectRatio: 9 / 16,
      maxHeight: 420,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.background.elevated,
      alignSelf: 'center',
    },
    pickPlaceholder: {
      width: '100%',
      aspectRatio: 9 / 16,
      maxHeight: 420,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.colors.border.strong,
      backgroundColor: theme.colors.background.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      alignSelf: 'center',
    },
    pickPlaceholderLabel: {
      color: theme.colors.text.disabled,
      fontSize: theme.typography.caption.fontSize,
      fontWeight: '600',
    },
    pressed: {
      opacity: 0.75,
    },
    composeRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    previewThumb: {
      width: 72,
      height: 128,
      borderRadius: theme.radius.sm,
      backgroundColor: theme.colors.background.elevated,
    },
    composeFields: {
      flex: 1,
      gap: theme.spacing.sm,
    },
    captionField: {
      minHeight: theme.layout.storyCaptionMinHeight,
      textAlignVertical: 'top',
    },
    hint: {
      color: theme.colors.text.disabled,
      fontSize: theme.typography.caption.fontSize,
      lineHeight: theme.typography.caption.lineHeight,
    },
  });
}

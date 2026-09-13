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
import {MAX_STORY_CAPTION_LENGTH} from '../../domain/Story';
import {usePublishStory} from '../hooks/useStories';

export type CreateStoryScreenProps = NativeStackScreenProps<AppStackParamList, 'CreateStory'>;

type Step = 'pick' | 'compose';

export function CreateStoryScreen({navigation}: CreateStoryScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const upload = useImageUpload();
  const publish = usePublishStory();
  const [step, setStep] = useState<Step>('pick');
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
      navigation.navigate('MainTabs', {screen: 'Home'});
    } catch (error) {
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

  const previewUri = upload.localPreviewUri ?? upload.attachment?.url;

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
        <Text
          accessibilityRole="header"
          style={{
            color: theme.colors.text.primary,
            fontSize: theme.typography.heading.fontSize,
            fontWeight: theme.typography.heading.fontWeight,
          }}>
          {step === 'pick' ? t('createStory.stepPick') : t('createStory.stepShare')}
        </Text>
        {step === 'compose' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('createStory.share')}
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
              {publish.isPending ? t('common.loading') : t('createStory.share')}
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
              {t('createStory.body')}
            </Text>

            {previewUri ? (
              <Image
                accessibilityLabel={t('createStory.previewA11y')}
                source={{uri: previewUri}}
                style={{
                  width: '100%',
                  aspectRatio: 9 / 16,
                  maxHeight: 420,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.background.elevated,
                  alignSelf: 'center',
                }}
                resizeMode="cover"
              />
            ) : null}

            {upload.state === 'uploading' ? (
              <Text
                style={{
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.caption.fontSize,
                }}>
                {t('createStory.uploading', {percent: Math.round(upload.progress * 100)})}
              </Text>
            ) : null}

            {upload.errorMessage ? (
              <ErrorState
                title={t('createStory.uploadFailed')}
                message={upload.errorMessage}
                onRetry={() => {
                  void onPick();
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
                void onPick();
              }}
            />
            {hasImage ? (
              <Button label={t('createStory.next')} onPress={() => setStep('compose')} />
            ) : null}
          </>
        ) : (
          <>
            <View style={{flexDirection: 'row', gap: theme.spacing.md}}>
              {previewUri ? (
                <Image
                  accessibilityLabel={t('createStory.previewA11y')}
                  source={{uri: previewUri}}
                  style={{
                    width: 72,
                    height: 128,
                    borderRadius: theme.radius.sm,
                    backgroundColor: theme.colors.background.elevated,
                  }}
                  resizeMode="cover"
                />
              ) : null}
              <View style={{flex: 1, gap: theme.spacing.sm}}>
                <TextField
                  label={t('createStory.captionLabel')}
                  value={caption}
                  onChangeText={setCaption}
                  maxLength={MAX_STORY_CAPTION_LENGTH}
                  editable={!publish.isPending}
                  placeholder={t('createStory.captionPlaceholder')}
                  multiline
                  style={{
                    minHeight: theme.layout.storyCaptionMinHeight,
                    textAlignVertical: 'top',
                  }}
                />
              </View>
            </View>

            <Text
              style={{
                color: theme.colors.text.disabled,
                fontSize: theme.typography.caption.fontSize,
                lineHeight: theme.typography.caption.lineHeight,
              }}>
              {t('createStory.expiryHint')}
            </Text>

            {upload.state === 'uploading' ? (
              <Text
                style={{
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.caption.fontSize,
                }}>
                {t('createStory.uploading', {percent: Math.round(upload.progress * 100)})}
              </Text>
            ) : null}

            {formError ? (
              <ErrorState title={t('createStory.publishFailed')} message={formError} />
            ) : null}

            <Button
              label={t('createStory.share')}
              loading={publish.isPending}
              disabled={!canPublish}
              onPress={() => {
                void onPublish();
              }}
            />
            <Button
              label={t('createStory.replaceImage')}
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

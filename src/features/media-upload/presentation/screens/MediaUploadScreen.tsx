import React, {useMemo, useState} from 'react';
import {Image, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../../../../app/navigation/types';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {Button} from '../../../../shared/ui/Button';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {Icon} from '../../../../shared/ui/Icon';
import {MediaLightbox} from '../../../../shared/ui/MediaLightbox';
import {ScreenHeader} from '../../../../shared/ui/ScreenHeader';
import {StepProgress} from '../../../../shared/ui/StepProgress';
import {UploadProgressBar} from '../../../../shared/ui/UploadProgressBar';
import {useImageUpload} from '../hooks/useImageUpload';

export type MediaUploadScreenProps = NativeStackScreenProps<AppStackParamList, 'MediaUpload'>;

export function MediaUploadScreen({navigation, route}: MediaUploadScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets.bottom), [theme, insets.bottom]);
  const upload = useImageUpload();
  const purpose = route.params?.purpose ?? 'general';
  const inProgress = upload.state === 'picking' || upload.state === 'uploading';
  const [viewerOpen, setViewerOpen] = useState(false);

  const title =
    purpose === 'avatar' ? t('mediaUpload.titleAvatar') : t('mediaUpload.titleImage');
  const primaryLabel =
    purpose === 'avatar'
      ? upload.state === 'success'
        ? t('mediaUpload.useAsAvatar')
        : t('mediaUpload.choosePhoto')
      : upload.state === 'success'
        ? t('mediaUpload.uploadAnother')
        : t('mediaUpload.choosePhoto');

  const previewUri = upload.localPreviewUri ?? upload.attachment?.url ?? null;
  const stepIndex =
    upload.state === 'success' ? 2 : upload.state === 'uploading' || upload.state === 'picking' ? 1 : 0;

  async function onPrimary(): Promise<void> {
    if (upload.state === 'success' && purpose === 'avatar' && upload.attachment) {
      navigation.navigate({
        name: 'EditProfile',
        params: {pictureUrl: upload.attachment.url},
        merge: true,
      });
      return;
    }
    if (upload.state === 'success') {
      upload.reset();
      await upload.pickAndUpload();
      return;
    }
    await upload.pickAndUpload();
  }

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={title}
        onBack={() => navigation.goBack()}
        backIcon="close"
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <StepProgress
          labels={[
            t('mediaUpload.stepPick'),
            t('mediaUpload.stepUpload'),
            t('mediaUpload.stepDone'),
          ]}
          currentIndex={stepIndex}
        />

        <Text style={styles.body}>{t('mediaUpload.body')}</Text>

        {previewUri ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('mediaUpload.openViewerA11y')}
            onPress={() => setViewerOpen(true)}
            style={({pressed}) => [pressed ? styles.previewPressed : null]}>
            <Image
              accessibilityLabel={t('mediaUpload.previewA11y')}
              source={{uri: previewUri}}
              style={[
                styles.preview,
                purpose === 'avatar' ? styles.previewAvatar : styles.previewWide,
              ]}
              resizeMode="cover"
            />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('mediaUpload.choosePhoto')}
            disabled={inProgress}
            onPress={() => {
              onPrimary().catch(() => undefined);
            }}
            style={({pressed}) => [
              styles.placeholder,
              purpose === 'avatar' ? styles.placeholderAvatar : styles.placeholderWide,
              pressed ? styles.previewPressed : null,
            ]}>
            <Icon name="image" size={36} color={theme.colors.text.disabled} />
            <Text style={styles.placeholderLabel}>{t('mediaUpload.pickPlaceholder')}</Text>
          </Pressable>
        )}

        <UploadProgressBar
          progress={upload.progress}
          visible={upload.state === 'uploading'}
          label={t('mediaUpload.uploading', {
            percent: Math.round(upload.progress * 100),
          })}
        />

        {upload.state === 'success' && upload.attachment ? (
          <Text style={styles.successTitle}>{t('mediaUpload.uploadComplete')}</Text>
        ) : null}

        {upload.state === 'error' && upload.errorMessage ? (
          <ErrorState
            title={t('mediaUpload.uploadFailed')}
            message={upload.errorMessage}
            onRetry={() => {
              upload.pickAndUpload().catch(() => undefined);
            }}
          />
        ) : null}

        <Button
          label={primaryLabel}
          loading={inProgress}
          disabled={inProgress}
          onPress={() => {
            onPrimary().catch(() => undefined);
          }}
        />
      </ScrollView>

      <MediaLightbox
        uri={previewUri}
        visible={viewerOpen}
        onClose={() => setViewerOpen(false)}
        accessibilityLabel={t('mediaUpload.previewA11y')}
      />
    </View>
  );
}

function createStyles(theme: Theme, insetBottom: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
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
    preview: {
      backgroundColor: theme.colors.background.elevated,
      alignSelf: 'center',
    },
    previewAvatar: {
      width: 160,
      height: 160,
      borderRadius: theme.radius.full,
    },
    previewWide: {
      width: '100%',
      height: theme.layout.mediaPreviewHeight,
      borderRadius: theme.radius.md,
    },
    previewPressed: {
      opacity: 0.85,
    },
    placeholder: {
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.colors.border.strong,
      backgroundColor: theme.colors.background.secondary,
    },
    placeholderAvatar: {
      width: 160,
      height: 160,
      borderRadius: theme.radius.full,
    },
    placeholderWide: {
      width: '100%',
      height: theme.layout.mediaPreviewHeight,
      borderRadius: theme.radius.md,
    },
    placeholderLabel: {
      color: theme.colors.text.disabled,
      fontSize: theme.typography.caption.fontSize,
      fontWeight: '600',
      textAlign: 'center',
      paddingHorizontal: theme.spacing.md,
    },
    successTitle: {
      color: theme.colors.state.success,
      fontSize: theme.typography.body.fontSize,
      lineHeight: theme.typography.body.lineHeight,
      fontWeight: '600',
      textAlign: 'center',
    },
  });
}

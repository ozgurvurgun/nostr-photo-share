import React from 'react';
import {Image, ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../../../../app/navigation/types';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import {Button} from '../../../../shared/ui/Button';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {ScreenHeader} from '../../../../shared/ui/ScreenHeader';
import {useImageUpload} from '../hooks/useImageUpload';

export type MediaUploadScreenProps = NativeStackScreenProps<AppStackParamList, 'MediaUpload'>;

export function MediaUploadScreen({navigation, route}: MediaUploadScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const upload = useImageUpload();
  const purpose = route.params?.purpose ?? 'general';
  const inProgress = upload.state === 'picking' || upload.state === 'uploading';

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
    <View style={{flex: 1, backgroundColor: theme.colors.background.primary}}>
      <ScreenHeader
        title={title}
        onBack={() => navigation.goBack()}
        backIcon="close"
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.screenEdge,
          paddingTop: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.lg,
          gap: theme.spacing.md,
        }}>
        <Text
          style={{
            color: theme.colors.text.secondary,
            fontSize: theme.typography.body.fontSize,
            lineHeight: theme.typography.body.lineHeight,
          }}>
          {t('mediaUpload.body')}
        </Text>

        {(upload.localPreviewUri || upload.attachment) && (
          <Image
            accessibilityLabel={t('mediaUpload.previewA11y')}
            source={{uri: upload.localPreviewUri ?? upload.attachment?.url}}
            style={{
              width: purpose === 'avatar' ? 160 : '100%',
              height: purpose === 'avatar' ? 160 : theme.layout.mediaPreviewHeight,
              borderRadius: purpose === 'avatar' ? theme.radius.full : theme.radius.md,
              backgroundColor: theme.colors.background.elevated,
              alignSelf: 'center',
            }}
            resizeMode="cover"
          />
        )}

        {upload.state === 'uploading' ? (
          <View style={{gap: theme.spacing.xs}}>
            <Text
              style={{
                color: theme.colors.text.secondary,
                fontSize: theme.typography.caption.fontSize,
                lineHeight: theme.typography.caption.lineHeight,
              }}>
              {t('mediaUpload.uploading', {percent: Math.round(upload.progress * 100)})}
            </Text>
            <View
              style={{
                height: theme.spacing.xs,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.background.elevated,
                overflow: 'hidden',
              }}>
              <View
                style={{
                  height: '100%',
                  width: `${Math.round(upload.progress * 100)}%`,
                  backgroundColor: theme.colors.accent.primary,
                }}
              />
            </View>
          </View>
        ) : null}

        {upload.state === 'success' && upload.attachment ? (
          <View style={{gap: theme.spacing.xs}}>
            <Text
              style={{
                color: theme.colors.state.success,
                fontSize: theme.typography.body.fontSize,
                lineHeight: theme.typography.body.lineHeight,
                fontWeight: '600',
              }}>
              {t('mediaUpload.uploadComplete')}
            </Text>
            <Text
              selectable
              style={{
                color: theme.colors.text.disabled,
                fontSize: theme.typography.caption.fontSize,
                lineHeight: theme.typography.caption.lineHeight,
              }}>
              {upload.attachment.url}
            </Text>
          </View>
        ) : null}

        {upload.state === 'error' && upload.errorMessage ? (
          <ErrorState
            title={t('mediaUpload.uploadFailed')}
            message={upload.errorMessage}
            onRetry={() => {
              void upload.pickAndUpload();
            }}
          />
        ) : null}

        <Button
          label={primaryLabel}
          loading={inProgress}
          disabled={inProgress}
          onPress={() => {
            void onPrimary();
          }}
        />
      </ScrollView>
    </View>
  );
}

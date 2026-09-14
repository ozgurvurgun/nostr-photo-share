import React, {useMemo} from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {StillHaptics} from '../haptics/haptics';
import {t} from '../i18n';
import {useTheme} from '../theme/ThemeProvider';
import type {Theme} from '../theme/types';
import {ErrorState} from './ErrorState';
import {Icon, type IconName} from './Icon';
import {KeyboardScreen} from './KeyboardScreen';
import {useToast} from './Toast';
import {UploadProgressBar} from './UploadProgressBar';

const DISPLAY_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

export type MediaStudioComposerProps = {
  readonly previewUri: string | null;
  readonly caption: string;
  readonly onChangeCaption: (value: string) => void;
  readonly captionMaxLength: number;
  readonly uploading: boolean;
  readonly uploadProgress: number;
  readonly publishing: boolean;
  readonly canPublish: boolean;
  readonly uploadError: string | null;
  readonly formError: string | null;
  readonly onClose: () => void;
  readonly onPick: () => void;
  readonly onPublish: () => void;
  readonly onRetryUpload: () => void;
  readonly onPreviewPress?: () => void;
};

type ToolDef = {
  readonly id: string;
  readonly icon: IconName;
  readonly labelKey:
    | 'composer.toolSticker'
    | 'composer.toolMusic'
    | 'composer.toolDraw'
    | 'composer.toolEffect';
};

const TOOLS: readonly ToolDef[] = [
  {id: 'sticker', icon: 'sticker', labelKey: 'composer.toolSticker'},
  {id: 'music', icon: 'music', labelKey: 'composer.toolMusic'},
  {id: 'draw', icon: 'draw', labelKey: 'composer.toolDraw'},
  {id: 'effect', icon: 'wand', labelKey: 'composer.toolEffect'},
];

/**
 * Story studio chrome (canvas, overlay caption, creative tools).
 * Post creation uses a separate Instagram-like flow.
 */
export function MediaStudioComposer({
  previewUri,
  caption,
  onChangeCaption,
  captionMaxLength,
  uploading,
  uploadProgress,
  publishing,
  canPublish,
  uploadError,
  formError,
  onClose,
  onPick,
  onPublish,
  onRetryUpload,
  onPreviewPress,
}: MediaStudioComposerProps): React.JSX.Element {
  const theme = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(theme, insets.top, insets.bottom),
    [theme, insets.top, insets.bottom],
  );
  const hasImage = Boolean(previewUri);
  const busy = uploading || publishing;
  const nextDisabled = hasImage ? !canPublish || busy : busy;

  function onToolPress(_label: string): void {
    StillHaptics.selection();
    toast.show(t('composer.toolComingSoon'), {tone: 'info'});
  }

  return (
    <KeyboardScreen style={styles.root}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={() => {
            StillHaptics.selection();
            onClose();
          }}
          style={({pressed}) => [styles.roundBtn, pressed ? styles.pressed : null]}>
          <Icon name="close" size={20} color={theme.colors.text.primary} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            hasImage ? t('createStory.share') : t('composer.pickGallery')
          }
          disabled={nextDisabled}
          onPress={() => {
            StillHaptics.selection();
            if (!hasImage) {
              onPick();
              return;
            }
            onPublish();
          }}
          style={({pressed}) => [
            styles.nextBtn,
            nextDisabled ? styles.nextDisabled : null,
            pressed && !nextDisabled ? styles.pressed : null,
          ]}>
          {busy ? (
            <ActivityIndicator color={theme.colors.accent.onAccent} />
          ) : (
            <Icon name="arrowRight" size={22} color={theme.colors.accent.onAccent} />
          )}
        </Pressable>
      </View>

      <View style={styles.canvasWrap}>
        <View style={styles.canvas}>
          {hasImage && previewUri ? (
            <Pressable
              accessibilityRole="imagebutton"
              accessibilityLabel={t('createStory.previewA11y')}
              disabled={!onPreviewPress}
              onPress={onPreviewPress}
              style={StyleSheet.absoluteFill}>
              <Image
                source={{uri: previewUri}}
                style={styles.preview}
                resizeMode="cover"
              />
            </Pressable>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.aaMark}>Aa</Text>
              <Icon name="image" size={36} color={theme.colors.accent.primary} />
              <Text style={styles.emptyTitle}>{t('composer.storyPickTitle')}</Text>
              <Text style={styles.emptyBody}>{t('composer.storyPickBody')}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('composer.pickGallery')}
                disabled={busy}
                onPress={() => {
                  StillHaptics.selection();
                  onPick();
                }}
                style={({pressed}) => [
                  styles.galleryCta,
                  pressed ? styles.pressed : null,
                ]}>
                <Text style={styles.galleryCtaLabel}>{t('composer.pickGallery')}</Text>
                <Icon name="chevronRight" size={16} color={theme.colors.text.inverse} />
              </Pressable>
            </View>
          )}

          {hasImage ? (
            <Text pointerEvents="none" style={styles.aaWatermark}>
              Aa
            </Text>
          ) : null}

          <View style={styles.sideRail} pointerEvents="box-none">
            {hasImage ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('composer.change')}
                disabled={busy}
                onPress={() => {
                  StillHaptics.selection();
                  onPick();
                }}
                style={({pressed}) => [
                  styles.changePill,
                  pressed ? styles.pressed : null,
                ]}>
                <Icon name="camera" size={14} color={theme.colors.text.primary} />
                <Text style={styles.changeLabel}>{t('composer.change')}</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('composer.pickGallery')}
              disabled={busy}
              onPress={() => {
                StillHaptics.selection();
                onPick();
              }}
              style={({pressed}) => [styles.sideBtn, pressed ? styles.pressed : null]}>
              <Icon name="camera" size={18} color={theme.colors.text.primary} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('composer.toolEffect')}
              onPress={() => onToolPress(t('composer.toolEffect'))}
              style={({pressed}) => [styles.sideBtn, pressed ? styles.pressed : null]}>
              <Icon name="sparkle" size={18} color={theme.colors.text.primary} />
            </Pressable>
          </View>

          <View style={styles.captionBlock}>
            <Text style={styles.captionLabel}>{t('composer.storyCaptionLabel')}</Text>
            <TextInput
              value={caption}
              onChangeText={onChangeCaption}
              maxLength={captionMaxLength}
              editable={!publishing}
              placeholder={t('composer.captionPlaceholder')}
              placeholderTextColor="rgba(244, 240, 230, 0.55)"
              multiline
              style={styles.captionInput}
            />
          </View>
        </View>
      </View>

      <UploadProgressBar
        progress={uploadProgress}
        visible={uploading}
        label={t('common.uploadingPercent', {
          percent: Math.round(uploadProgress * 100),
        })}
      />

      {uploadError ? (
        <View style={styles.errorPad}>
          <ErrorState
            title={t('createStory.uploadFailed')}
            message={uploadError}
            onRetry={onRetryUpload}
          />
        </View>
      ) : null}
      {formError ? (
        <View style={styles.errorPad}>
          <ErrorState title={t('createStory.publishFailed')} message={formError} />
        </View>
      ) : null}

      <View style={styles.tools}>
        {TOOLS.map(tool => (
          <Pressable
            key={tool.id}
            accessibilityRole="button"
            accessibilityLabel={t(tool.labelKey)}
            onPress={() => onToolPress(t(tool.labelKey))}
            style={({pressed}) => [styles.tool, pressed ? styles.pressed : null]}>
            <Icon name={tool.icon} size={20} color={theme.colors.text.primary} />
            <Text style={styles.toolLabel}>{t(tool.labelKey)}</Text>
          </Pressable>
        ))}
      </View>
    </KeyboardScreen>
  );
}

function createStyles(theme: Theme, insetTop: number, insetBottom: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: '#0B0A09',
      paddingTop: insetTop,
      paddingBottom: insetBottom + theme.spacing.lg,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.screenEdge,
      paddingVertical: theme.spacing.sm,
    },
    roundBtn: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(36, 34, 30, 0.92)',
    },
    nextBtn: {
      minWidth: 72,
      height: 44,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.accent.primary,
    },
    nextDisabled: {
      opacity: 0.4,
    },
    canvasWrap: {
      flex: 1,
      paddingHorizontal: theme.spacing.screenEdge,
      paddingBottom: theme.spacing.sm,
    },
    canvas: {
      flex: 1,
      borderRadius: theme.radius.xl,
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: theme.colors.accent.primary,
      backgroundColor: '#1A1510',
      alignSelf: 'center',
      width: '100%',
    },
    preview: {
      ...StyleSheet.absoluteFill,
      width: '100%',
      height: '100%',
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    aaMark: {
      position: 'absolute',
      top: '18%',
      fontFamily: DISPLAY_FONT,
      fontSize: 64,
      color: 'rgba(200, 146, 42, 0.35)',
      fontWeight: '600',
    },
    aaWatermark: {
      position: 'absolute',
      top: '22%',
      alignSelf: 'center',
      fontFamily: DISPLAY_FONT,
      fontSize: 72,
      color: 'rgba(244, 240, 230, 0.16)',
      fontWeight: '600',
    },
    emptyTitle: {
      color: theme.colors.accent.primary,
      fontSize: theme.typography.heading.fontSize,
      fontWeight: '700',
      textAlign: 'center',
      marginTop: theme.spacing.sm,
    },
    emptyBody: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
      lineHeight: theme.typography.caption.lineHeight,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    galleryCta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      backgroundColor: '#F4F0E6',
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm + 2,
      marginTop: theme.spacing.xs,
    },
    galleryCtaLabel: {
      color: theme.colors.text.inverse,
      fontWeight: '700',
      fontSize: theme.typography.body.fontSize,
    },
    sideRail: {
      position: 'absolute',
      top: theme.spacing.md,
      right: theme.spacing.md,
      alignItems: 'flex-end',
      gap: theme.spacing.sm,
    },
    changePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(18, 17, 15, 0.72)',
      borderRadius: theme.radius.full,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 8,
    },
    changeLabel: {
      color: theme.colors.text.primary,
      fontSize: 12,
      fontWeight: '700',
    },
    sideBtn: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(18, 17, 15, 0.72)',
    },
    captionBlock: {
      position: 'absolute',
      left: theme.spacing.md,
      right: 72,
      bottom: theme.spacing.md,
      gap: 4,
    },
    captionLabel: {
      color: '#F4F0E6',
      fontSize: 12,
      fontWeight: '700',
      textShadowColor: 'rgba(0,0,0,0.45)',
      textShadowOffset: {width: 0, height: 1},
      textShadowRadius: 3,
    },
    captionInput: {
      color: '#F4F0E6',
      fontSize: theme.typography.body.fontSize,
      minHeight: 28,
      maxHeight: 88,
      padding: 0,
      textShadowColor: 'rgba(0,0,0,0.45)',
      textShadowOffset: {width: 0, height: 1},
      textShadowRadius: 3,
    },
    errorPad: {
      paddingHorizontal: theme.spacing.screenEdge,
    },
    tools: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.screenEdge,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    tool: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.background.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.default,
    },
    toolLabel: {
      color: theme.colors.text.primary,
      fontSize: 11,
      fontWeight: '600',
    },
    pressed: {
      opacity: 0.75,
    },
  });
}

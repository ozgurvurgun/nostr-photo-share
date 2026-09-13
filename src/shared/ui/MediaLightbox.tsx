import React, {useMemo} from 'react';
import {Modal, Pressable, StyleSheet, Text} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import FastImage from '@d11/react-native-fast-image';
import {t} from '../i18n';
import {useTheme} from '../theme/ThemeProvider';
import type {Theme} from '../theme/types';
import {ZoomableImage} from './ZoomableImage';

export type MediaLightboxProps = {
  readonly uri: string | null;
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly accessibilityLabel?: string;
};

/**
 * Full-screen pinch/pan media viewer (create/upload previews).
 * Owns its GestureHandlerRootView so gestures work inside Android Modal.
 */
export function MediaLightbox({
  uri,
  visible,
  onClose,
  accessibilityLabel,
}: MediaLightboxProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(theme, insets.top),
    [theme, insets.top],
  );

  return (
    <Modal
      visible={visible && Boolean(uri)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <GestureHandlerRootView style={styles.root}>
        {uri ? (
          <ZoomableImage
            key={uri}
            uri={uri}
            accessibilityLabel={accessibilityLabel}
            style={styles.media}
            resizeMode="contain"
            priority={FastImage.priority.high}
          />
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('mediaViewer.closeA11y')}
          onPress={onClose}
          hitSlop={theme.layout.hitSlop}
          style={({pressed}) => [
            styles.closeChip,
            pressed ? styles.closePressed : null,
          ]}>
          <Text style={styles.closeLabel}>{t('common.close')}</Text>
        </Pressable>
      </GestureHandlerRootView>
    </Modal>
  );
}

function createStyles(theme: Theme, insetTop: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    media: {
      ...StyleSheet.absoluteFill,
    },
    closeChip: {
      position: 'absolute',
      top: insetTop + theme.spacing.sm,
      right: theme.spacing.screenEdge,
      zIndex: 2,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.overlay.scrim,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.overlay.glassStroke,
    },
    closePressed: {
      opacity: 0.75,
    },
    closeLabel: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.body.fontSize,
      fontWeight: '600',
    },
  });
}

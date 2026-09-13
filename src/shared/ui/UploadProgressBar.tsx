import React, {useEffect, useMemo, useState} from 'react';
import {LayoutChangeEvent, StyleSheet, Text, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {t} from '../i18n';
import {useTheme} from '../theme/ThemeProvider';
import type {Theme} from '../theme/types';

export type UploadProgressBarProps = {
  readonly progress: number;
  readonly label?: string;
  readonly visible?: boolean;
};

/** Brand-tinted, animated upload progress for create/media flows. */
export function UploadProgressBar({
  progress,
  label,
  visible = true,
}: UploadProgressBarProps): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const fillWidth = useSharedValue(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const clamped = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    if (!visible || trackWidth <= 0) {
      fillWidth.value = 0;
      return;
    }
    fillWidth.value = withTiming(clamped * trackWidth, {
      duration: theme.motion.duration.short,
    });
  }, [clamped, fillWidth, theme.motion.duration.short, trackWidth, visible]);

  const fillStyle = useAnimatedStyle(() => ({
    width: fillWidth.value,
  }));

  if (!visible) {
    return null;
  }

  const percent = Math.round(clamped * 100);
  const resolvedLabel = label ?? t('common.uploadingPercent', {percent});

  function onTrackLayout(event: LayoutChangeEvent): void {
    setTrackWidth(event.nativeEvent.layout.width);
  }

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{min: 0, max: 100, now: percent}}
      style={styles.root}>
      <Text style={styles.label}>{resolvedLabel}</Text>
      <View style={styles.track} onLayout={onTrackLayout}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      gap: theme.spacing.xs,
    },
    label: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
      lineHeight: theme.typography.caption.lineHeight,
    },
    track: {
      height: theme.spacing.xs,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.background.elevated,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accent.primary,
    },
  });
}

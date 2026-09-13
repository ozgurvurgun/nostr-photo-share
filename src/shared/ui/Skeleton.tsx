import React, {useEffect, useMemo} from 'react';
import {StyleSheet, type ViewProps} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {useTheme} from '../theme/ThemeProvider';
import type {Theme} from '../theme/types';

export type SkeletonProps = ViewProps & {
  readonly width?: number | `${number}%`;
  readonly height?: number;
  readonly radius?: number;
  /** Soft opacity pulse; default on for feed/story placeholders. */
  readonly shimmer?: boolean;
};

/** Neutral placeholder block with optional shimmer for loading surfaces. */
export function Skeleton({
  width = '100%',
  height = 16,
  radius,
  shimmer = true,
  style,
  ...rest
}: SkeletonProps): React.JSX.Element {
  const theme = useTheme();
  const opacity = useSharedValue(1);
  const styles = useMemo(
    () => createStyles(theme, width, height, radius),
    [theme, width, height, radius],
  );

  useEffect(() => {
    if (!shimmer) {
      opacity.value = 1;
      return;
    }
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.45, {duration: theme.motion.duration.deliberate}),
        withTiming(1, {duration: theme.motion.duration.deliberate}),
      ),
      -1,
      false,
    );
  }, [opacity, shimmer, theme.motion.duration.deliberate]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.block, animatedStyle, style]}
      {...rest}
    />
  );
}

function createStyles(
  theme: Theme,
  width: number | `${number}%`,
  height: number,
  radius: number | undefined,
) {
  return StyleSheet.create({
    block: {
      width,
      height,
      borderRadius: radius ?? theme.radius.sm,
      backgroundColor: theme.colors.background.elevated,
    },
  });
}

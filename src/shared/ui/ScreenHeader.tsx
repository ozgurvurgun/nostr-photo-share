import React, {useMemo} from 'react';
import {Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {StillHaptics} from '../haptics/haptics';
import {t} from '../i18n';
import {useTheme} from '../theme/ThemeProvider';
import type {Theme} from '../theme/types';
import {Icon, type IconName} from './Icon';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const DISPLAY_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

export type ScreenHeaderProps = {
  readonly title: string;
  readonly onBack?: () => void;
  /** Defaults to chevron when onBack is set; use close for dismissible flows. */
  readonly backIcon?: Extract<IconName, 'chevronLeft' | 'close'>;
  readonly backAccessibilityLabel?: string;
  readonly rightLabel?: string;
  readonly rightIcon?: IconName;
  readonly onRightPress?: () => void;
  readonly rightDisabled?: boolean;
  readonly rightLoading?: boolean;
  /** When false, safe-area top padding is omitted (parent already applied it). */
  readonly includeSafeArea?: boolean;
  readonly border?: boolean;
  /** Serif display title used on settings / mock-aligned screens. */
  readonly displayTitle?: boolean;
};

/**
 * Shared top bar for stack screens - matches CreatePost / CreateStory chrome.
 */
export function ScreenHeader({
  title,
  onBack,
  backIcon = 'chevronLeft',
  backAccessibilityLabel,
  rightLabel,
  rightIcon,
  onRightPress,
  rightDisabled = false,
  rightLoading = false,
  includeSafeArea = true,
  border = true,
  displayTitle = false,
}: ScreenHeaderProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const canRight = Boolean(onRightPress && (rightLabel || rightIcon));
  const styles = useMemo(
    () => createStyles(theme, includeSafeArea ? insets.top : 0, border, displayTitle),
    [theme, includeSafeArea, insets.top, border, displayTitle],
  );
  const backScale = useSharedValue(1);
  const rightScale = useSharedValue(1);
  const backStyle = useAnimatedStyle(() => ({
    transform: [{scale: backScale.value}],
  }));
  const rightStyle = useAnimatedStyle(() => ({
    transform: [{scale: rightScale.value}],
  }));

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        {onBack ? (
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={
              backAccessibilityLabel ??
              (backIcon === 'close' ? t('common.close') : t('common.back'))
            }
            onPress={() => {
              StillHaptics.selection();
              onBack();
            }}
            onPressIn={() => {
              backScale.value = withTiming(0.92, {
                duration: theme.motion.duration.micro,
              });
            }}
            onPressOut={() => {
              backScale.value = withSpring(1, {damping: 16});
            }}
            hitSlop={theme.layout.hitSlop}
            style={[styles.side, backStyle]}>
            <Icon name={backIcon} size={24} color={theme.colors.text.primary} />
          </AnimatedPressable>
        ) : (
          <View style={styles.side} />
        )}

        <Text accessibilityRole="header" numberOfLines={1} style={styles.title}>
          {title}
        </Text>

        {canRight ? (
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={rightLabel ?? backAccessibilityLabel}
            disabled={rightDisabled || rightLoading}
            onPress={() => {
              StillHaptics.selection();
              onRightPress?.();
            }}
            onPressIn={() => {
              if (!(rightDisabled || rightLoading)) {
                rightScale.value = withTiming(0.94, {
                  duration: theme.motion.duration.micro,
                });
              }
            }}
            onPressOut={() => {
              rightScale.value = withSpring(1, {damping: 16});
            }}
            hitSlop={theme.layout.hitSlop}
            style={[
              styles.side,
              styles.sideEnd,
              rightDisabled || rightLoading ? styles.disabled : null,
              rightStyle,
            ]}>
            {rightIcon ? (
              <Icon name={rightIcon} size={22} color={theme.colors.text.primary} />
            ) : (
              <Text style={styles.rightLabel}>
                {rightLoading ? t('common.loading') : rightLabel}
              </Text>
            )}
          </AnimatedPressable>
        ) : (
          <View style={styles.side} />
        )}
      </View>
    </View>
  );
}

function createStyles(
  theme: Theme,
  paddingTop: number,
  border: boolean,
  displayTitle: boolean,
) {
  return StyleSheet.create({
    root: {
      paddingTop,
      backgroundColor: theme.colors.background.primary,
      borderBottomWidth: border ? StyleSheet.hairlineWidth : 0,
      borderBottomColor: theme.colors.border.default,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.screenEdge,
      paddingVertical: theme.spacing.sm,
      minHeight: 48,
    },
    side: {
      width: theme.layout.headerControlSize,
      alignItems: 'flex-start',
      justifyContent: 'center',
    },
    sideEnd: {
      alignItems: 'flex-end',
      minWidth: theme.layout.headerControlSize,
      width: undefined,
    },
    title: {
      flex: 1,
      textAlign: 'center',
      color: theme.colors.text.primary,
      fontSize: displayTitle ? 18 : theme.typography.heading.fontSize,
      lineHeight: displayTitle ? 24 : theme.typography.heading.lineHeight,
      fontWeight: displayTitle ? '600' : theme.typography.heading.fontWeight,
      fontFamily: displayTitle ? DISPLAY_FONT : undefined,
    },
    rightLabel: {
      color: theme.colors.accent.primary,
      fontSize: theme.typography.bodyStrong.fontSize,
      lineHeight: theme.typography.bodyStrong.lineHeight,
      fontWeight: theme.typography.bodyStrong.fontWeight,
    },
    disabled: {
      opacity: 0.4,
    },
  });
}

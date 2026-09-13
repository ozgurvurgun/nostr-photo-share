import React, {useMemo} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {StillHaptics} from '../haptics/haptics';
import {useTheme} from '../theme/ThemeProvider';
import type {Theme} from '../theme/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  readonly label: string;
  readonly variant?: ButtonVariant;
  readonly loading?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  onPress,
  onPressIn,
  onPressOut,
  ...rest
}: ButtonProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme, variant), [theme, variant]);
  const isDisabled = Boolean(disabled || loading);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{disabled: isDisabled, busy: loading}}
      disabled={isDisabled}
      onPressIn={event => {
        if (!isDisabled) {
          StillHaptics.selection();
          scale.value = withTiming(0.97, {duration: theme.motion.duration.micro});
        }
        onPressIn?.(event);
      }}
      onPressOut={event => {
        scale.value = withSpring(1, {damping: 16});
        onPressOut?.(event);
      }}
      onPress={onPress}
      style={[
        styles.base,
        isDisabled ? styles.disabled : null,
        animatedStyle,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={styles.label.color} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </AnimatedPressable>
  );
}

function createStyles(theme: Theme, variant: ButtonVariant) {
  const backgroundColor =
    variant === 'primary'
      ? theme.colors.accent.primary
      : variant === 'danger'
        ? theme.colors.state.error
        : variant === 'secondary'
          ? theme.colors.background.elevated
          : 'transparent';

  const textColor =
    variant === 'primary' ? theme.colors.accent.onAccent : theme.colors.text.primary;

  const borderColor =
    variant === 'ghost' || variant === 'secondary'
      ? theme.colors.border.default
      : backgroundColor;

  return StyleSheet.create({
    base: {
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      backgroundColor,
      borderColor,
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    },
    disabled: {
      opacity: 0.5,
    },
    label: {
      color: textColor,
      fontSize: theme.typography.button.fontSize,
      lineHeight: theme.typography.button.lineHeight,
      fontWeight: theme.typography.button.fontWeight,
      textAlign: 'center',
    },
  });
}

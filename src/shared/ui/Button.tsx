import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from 'react-native';
import {useTheme} from '../theme/ThemeProvider';

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
  ...rest
}: ButtonProps): React.JSX.Element {
  const theme = useTheme();
  const isDisabled = Boolean(disabled || loading);

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
    variant === 'ghost' || variant === 'secondary' ? theme.colors.border.default : backgroundColor;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{disabled: isDisabled, busy: loading}}
      disabled={isDisabled}
      style={({pressed}) => [
        styles.base,
        {
          backgroundColor,
          borderColor,
          borderRadius: theme.radius.md,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={{
            color: textColor,
            fontSize: theme.typography.body.fontSize,
            lineHeight: theme.typography.body.lineHeight,
            fontWeight: '600',
            textAlign: 'center',
          }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
});

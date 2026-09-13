import React, {useMemo, useState} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {StillHaptics} from '../haptics/haptics';
import {t} from '../i18n';
import {useTheme} from '../theme/ThemeProvider';
import type {Theme} from '../theme/types';
import {Icon} from './Icon';

export type TextFieldProps = TextInputProps & {
  readonly label: string;
  readonly errorText?: string;
  /** Shows a help (?) control next to the label. */
  readonly onHelpPress?: () => void;
  readonly helpAccessibilityLabel?: string;
};

export function TextField({
  label,
  errorText,
  onHelpPress,
  helpAccessibilityLabel,
  style,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps): React.JSX.Element {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const styles = useMemo(
    () => createStyles(theme, Boolean(errorText), focused),
    [theme, errorText, focused],
  );
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {onHelpPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              helpAccessibilityLabel ?? t('common.helpA11y', {topic: label})
            }
            onPress={() => {
              StillHaptics.selection();
              onHelpPress();
            }}
            hitSlop={theme.layout.hitSlop}
            style={({pressed}) => (pressed ? styles.pressed : null)}>
            <Icon name="help" size={18} color={theme.colors.text.secondary} />
          </Pressable>
        ) : null}
      </View>
      <Animated.View style={animatedStyle}>
        <TextInput
          placeholderTextColor={theme.colors.text.disabled}
          style={[styles.input, style]}
          onFocus={event => {
            setFocused(true);
            scale.value = withTiming(1.01, {duration: theme.motion.duration.micro});
            onFocus?.(event);
          }}
          onBlur={event => {
            setFocused(false);
            scale.value = withTiming(1, {duration: theme.motion.duration.micro});
            onBlur?.(event);
          }}
          {...rest}
        />
      </Animated.View>
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
    </View>
  );
}

function createStyles(theme: Theme, hasError: boolean, focused: boolean) {
  return StyleSheet.create({
    container: {
      width: '100%',
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
    },
    label: {
      flexShrink: 1,
      color: theme.colors.text.secondary,
      fontSize: theme.typography.label.fontSize,
      lineHeight: theme.typography.label.lineHeight,
      fontWeight: theme.typography.label.fontWeight,
      letterSpacing: theme.typography.label.letterSpacing,
      textTransform: theme.typography.label.textTransform,
    },
    input: {
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.background.elevated,
      borderColor: hasError
        ? theme.colors.state.error
        : focused
          ? theme.colors.accent.primary
          : theme.colors.border.default,
      borderWidth: focused || hasError ? 1.5 : 1,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: theme.typography.body.fontSize,
      lineHeight: theme.typography.body.lineHeight,
      minHeight: 48,
    },
    error: {
      marginTop: theme.spacing.xs,
      color: theme.colors.state.error,
      fontSize: theme.typography.caption.fontSize,
      lineHeight: theme.typography.caption.lineHeight,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}

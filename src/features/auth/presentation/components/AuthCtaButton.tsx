import React, {useMemo} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
} from 'react-native';
import {StillHaptics} from '../../../../shared/haptics/haptics';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {Icon} from '../../../../shared/ui/Icon';

export type AuthCtaButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  readonly label: string;
  readonly loading?: boolean;
};

export function AuthCtaButton({
  label,
  loading = false,
  disabled,
  onPress,
  ...rest
}: AuthCtaButtonProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{disabled: isDisabled, busy: loading}}
      disabled={isDisabled}
      onPress={event => {
        if (!isDisabled) {
          StillHaptics.selection();
        }
        onPress?.(event);
      }}
      style={({pressed}) => [
        styles.base,
        isDisabled ? styles.disabled : null,
        pressed && !isDisabled ? styles.pressed : null,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={theme.colors.accent.onAccent} />
      ) : (
        <View style={styles.row}>
          <Text style={styles.label}>{label}</Text>
          <Icon name="chevronRight" size={18} color={theme.colors.accent.onAccent} />
        </View>
      )}
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    base: {
      minHeight: 56,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.accent.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    label: {
      color: theme.colors.accent.onAccent,
      fontSize: theme.typography.button.fontSize,
      lineHeight: theme.typography.button.lineHeight,
      fontWeight: theme.typography.button.fontWeight,
    },
    disabled: {
      opacity: 0.5,
    },
    pressed: {
      opacity: 0.88,
      transform: [{scale: 0.985}],
    },
  });
}

import React, {useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {StillHaptics} from '../haptics/haptics';
import {useTheme} from '../theme/ThemeProvider';
import type {Theme} from '../theme/types';
import {Icon, type IconName} from './Icon';

export type SettingsRowProps = {
  readonly label: string;
  readonly icon: IconName;
  readonly onPress: () => void;
  readonly danger?: boolean;
  readonly accent?: boolean;
  readonly accessibilityLabel?: string;
};

/** Instagram-style settings list row (icon + label + chevron). */
export function SettingsRow({
  label,
  icon,
  onPress,
  danger = false,
  accent = false,
  accessibilityLabel,
}: SettingsRowProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const tint = danger
    ? theme.colors.state.error
    : accent
      ? theme.colors.accent.primary
      : theme.colors.text.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={() => {
        StillHaptics.selection();
        onPress();
      }}
      style={({pressed}) => [styles.row, pressed ? styles.pressed : null]}>
      <View style={styles.leading}>
        <Icon name={icon} size={22} color={tint} />
        <Text style={[styles.label, danger ? styles.labelDanger : null]}>{label}</Text>
      </View>
      {!danger ? (
        <View style={styles.chevron}>
          <Icon name="chevronRight" size={18} color={theme.colors.text.disabled} />
        </View>
      ) : null}
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 52,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    leading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      flex: 1,
    },
    label: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.body.fontSize,
      fontWeight: '500',
    },
    labelDanger: {
      color: theme.colors.state.error,
    },
    chevron: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      opacity: 0.7,
      backgroundColor: theme.colors.background.surface,
    },
  });
}

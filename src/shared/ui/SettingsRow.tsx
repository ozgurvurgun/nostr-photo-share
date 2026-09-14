import React, {useMemo} from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {StillHaptics} from '../haptics/haptics';
import {useTheme} from '../theme/ThemeProvider';
import type {Theme} from '../theme/types';
import {Icon, type IconName} from './Icon';

export type SettingsRowProps = {
  readonly label: string;
  readonly icon: IconName;
  readonly onPress?: () => void;
  readonly danger?: boolean;
  readonly accent?: boolean;
  readonly accessibilityLabel?: string;
  readonly switchValue?: boolean;
  readonly onSwitchChange?: (value: boolean) => void;
  readonly detail?: string;
};

/** Instagram-style settings list row (icon + label + chevron or switch). */
export function SettingsRow({
  label,
  icon,
  onPress,
  danger = false,
  accent = false,
  accessibilityLabel,
  switchValue,
  onSwitchChange,
  detail,
}: SettingsRowProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const tint = danger
    ? theme.colors.state.error
    : accent
      ? theme.colors.accent.primary
      : theme.colors.text.primary;
  const isSwitch = onSwitchChange !== undefined && switchValue !== undefined;

  const content = (
    <>
      <View style={styles.leading}>
        <Icon name={icon} size={22} color={tint} />
        <View style={styles.textCol}>
          <Text style={[styles.label, danger ? styles.labelDanger : null]}>
            {label}
          </Text>
          {detail ? <Text style={styles.detail}>{detail}</Text> : null}
        </View>
      </View>
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={value => {
            StillHaptics.selection();
            onSwitchChange(value);
          }}
          trackColor={{
            false: theme.colors.border.default,
            true: theme.colors.accent.primary,
          }}
          thumbColor={theme.colors.background.elevated}
          ios_backgroundColor={theme.colors.border.default}
          accessibilityLabel={accessibilityLabel ?? label}
        />
      ) : !danger ? (
        <View style={styles.chevron}>
          <Icon name="chevronRight" size={18} color={theme.colors.text.disabled} />
        </View>
      ) : null}
    </>
  );

  if (isSwitch) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={() => {
        StillHaptics.selection();
        onPress?.();
      }}
      style={({pressed}) => [styles.row, pressed ? styles.pressed : null]}>
      {content}
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
      paddingRight: theme.spacing.sm,
    },
    textCol: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    label: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.body.fontSize,
      fontWeight: '500',
    },
    labelDanger: {
      color: theme.colors.state.error,
    },
    detail: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
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

import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {t} from '../i18n';
import {useTheme} from '../theme/ThemeProvider';
import type {Theme} from '../theme/types';

export type StepProgressProps = {
  readonly labels: readonly string[];
  readonly currentIndex: number;
};

/** Compact step strip for create/upload flows (pick → compose → publish). */
export function StepProgress({
  labels,
  currentIndex,
}: StepProgressProps): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (labels.length === 0) {
    return null;
  }

  const safeIndex = Math.max(0, Math.min(currentIndex, labels.length - 1));

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={t('common.stepOf', {
        current: safeIndex + 1,
        total: labels.length,
      })}
      style={styles.row}>
      {labels.map((label, index) => {
        const active = index === safeIndex;
        const done = index < safeIndex;
        return (
          <React.Fragment key={`${label}-${index}`}>
            {index > 0 ? (
              <View
                style={[styles.connector, done || active ? styles.connectorActive : null]}
              />
            ) : null}
            <View style={styles.item}>
              <View
                style={[
                  styles.dot,
                  done || active ? styles.dotActive : styles.dotIdle,
                ]}
              />
              <Text
                numberOfLines={1}
                style={[styles.label, active ? styles.labelActive : null]}>
                {label}
              </Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.xs,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xxs,
      flexShrink: 1,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: theme.radius.full,
    },
    dotActive: {
      backgroundColor: theme.colors.accent.primary,
    },
    dotIdle: {
      backgroundColor: theme.colors.border.default,
    },
    label: {
      color: theme.colors.text.disabled,
      fontSize: theme.typography.badge.fontSize,
      fontWeight: theme.typography.badge.fontWeight,
      maxWidth: 88,
    },
    labelActive: {
      color: theme.colors.text.primary,
    },
    connector: {
      width: theme.spacing.lg,
      height: StyleSheet.hairlineWidth * 2,
      backgroundColor: theme.colors.border.default,
      borderRadius: theme.radius.full,
    },
    connectorActive: {
      backgroundColor: theme.colors.accent.primary,
    },
  });
}

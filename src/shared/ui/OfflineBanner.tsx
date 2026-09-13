import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {t} from '../i18n';
import {useTheme} from '../theme/ThemeProvider';
import type {Theme} from '../theme/types';

export type OfflineBannerProps = {
  readonly visible: boolean;
  readonly message?: string;
  readonly stale?: boolean;
};

/** Persistent, non-blocking offline / stale-cache indicator (Section 32.6). */
export function OfflineBanner({
  visible,
  message,
  stale = false,
}: OfflineBannerProps): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  if (!visible) {
    return null;
  }

  const resolvedMessage = message ?? t('common.offline');

  return (
    <View accessibilityRole="summary" style={styles.root}>
      <Text style={styles.text}>
        {stale
          ? `${resolvedMessage} ${t('common.offlineStaleSuffix')}`
          : resolvedMessage}
      </Text>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.background.secondary,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.default,
    },
    text: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
      lineHeight: theme.typography.caption.lineHeight,
    },
  });
}

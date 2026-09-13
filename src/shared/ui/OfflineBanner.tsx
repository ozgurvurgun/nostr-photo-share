import React from 'react';
import {Text, View} from 'react-native';
import {t} from '../i18n';
import {useTheme} from '../theme/ThemeProvider';

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
  if (!visible) {
    return null;
  }

  const resolvedMessage = message ?? t('common.offline');

  return (
    <View
      accessibilityRole="summary"
      style={{
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.default,
      }}>
      <Text
        style={{
          color: theme.colors.text.secondary,
          fontSize: theme.typography.caption.fontSize,
          lineHeight: theme.typography.caption.lineHeight,
        }}>
        {stale
          ? `${resolvedMessage} ${t('common.offlineStaleSuffix')}`
          : resolvedMessage}
      </Text>
    </View>
  );
}

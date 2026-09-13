import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {t} from '../i18n';
import {useTheme} from '../theme/ThemeProvider';
import type {Theme} from '../theme/types';
import {Button} from './Button';

export type ErrorStateProps = {
  readonly title: string;
  readonly message: string;
  readonly retryLabel?: string;
  readonly onRetry?: () => void;
};

export function ErrorState({
  title,
  message,
  retryLabel,
  onRetry,
}: ErrorStateProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const resolvedRetryLabel = retryLabel ?? t('common.retry');

  return (
    <View accessibilityRole="alert" style={styles.root}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Button label={resolvedRetryLabel} variant="secondary" onPress={onRetry} />
      ) : null}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.radius.md,
    },
    title: {
      color: theme.colors.state.error,
      fontSize: theme.typography.heading.fontSize,
      lineHeight: theme.typography.heading.lineHeight,
      fontWeight: theme.typography.heading.fontWeight,
    },
    message: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.body.fontSize,
      lineHeight: theme.typography.body.lineHeight,
    },
  });
}

import React from 'react';
import {Text, View} from 'react-native';
import {t} from '../i18n';
import {useTheme} from '../theme/ThemeProvider';
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
  const resolvedRetryLabel = retryLabel ?? t('common.retry');

  return (
    <View
      accessibilityRole="alert"
      style={{
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.radius.md,
      }}>
      <Text
        style={{
          color: theme.colors.state.error,
          fontSize: theme.typography.heading.fontSize,
          lineHeight: theme.typography.heading.lineHeight,
          fontWeight: theme.typography.heading.fontWeight,
        }}>
        {title}
      </Text>
      <Text
        style={{
          color: theme.colors.text.secondary,
          fontSize: theme.typography.body.fontSize,
          lineHeight: theme.typography.body.lineHeight,
        }}>
        {message}
      </Text>
      {onRetry ? (
        <Button label={resolvedRetryLabel} variant="secondary" onPress={onRetry} />
      ) : null}
    </View>
  );
}

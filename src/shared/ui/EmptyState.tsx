import React from 'react';
import {Text, View} from 'react-native';
import {useTheme} from '../theme/ThemeProvider';
import {Button} from './Button';

export type EmptyStateProps = {
  readonly title: string;
  readonly message: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
};

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      style={{
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
        alignItems: 'flex-start',
      }}>
      <Text
        style={{
          color: theme.colors.text.primary,
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
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="secondary" onPress={onAction} />
      ) : null}
    </View>
  );
}

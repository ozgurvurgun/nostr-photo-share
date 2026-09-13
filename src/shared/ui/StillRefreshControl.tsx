import React from 'react';
import {RefreshControl, type RefreshControlProps} from 'react-native';
import {useTheme} from '../theme/ThemeProvider';

export type StillRefreshControlProps = Omit<
  RefreshControlProps,
  'tintColor' | 'colors' | 'progressBackgroundColor'
>;

/** Brand-tinted pull-to-refresh control for Still lists. */
export function StillRefreshControl(props: StillRefreshControlProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <RefreshControl
      {...props}
      tintColor={theme.colors.accent.primary}
      colors={[theme.colors.accent.primary]}
      progressBackgroundColor={theme.colors.background.elevated}
    />
  );
}

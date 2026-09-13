import React from 'react';
import {View, type ViewProps} from 'react-native';
import {useTheme} from '../theme/ThemeProvider';

export type SkeletonProps = ViewProps & {
  readonly width?: number | `${number}%`;
  readonly height?: number;
  readonly radius?: number;
};

/** Neutral placeholder block for list/content loading (Section 32.6). */
export function Skeleton({
  width = '100%',
  height = 16,
  radius,
  style,
  ...rest
}: SkeletonProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          borderRadius: radius ?? theme.radius.sm,
          backgroundColor: theme.colors.background.elevated,
        },
        style,
      ]}
      {...rest}
    />
  );
}

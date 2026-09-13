import React from 'react';
import {View} from 'react-native';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import {Skeleton} from '../../../../shared/ui/Skeleton';

export function FeedSkeletonList({count = 3}: {readonly count?: number}): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={{gap: theme.spacing.lg}}>
      {Array.from({length: count}, (_, index) => (
        <View key={index} style={{gap: theme.spacing.sm}}>
          <Skeleton height={14} width="40%" />
          <Skeleton height={280} radius={theme.radius.md} />
          <Skeleton height={14} width="70%" />
          <Skeleton height={12} width="55%" />
        </View>
      ))}
    </View>
  );
}

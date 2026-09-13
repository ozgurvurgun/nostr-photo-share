import React from 'react';
import {ScrollView, View} from 'react-native';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import {Skeleton} from '../../../../shared/ui/Skeleton';

export function StoryRingSkeleton({count = 5}: {readonly count?: number}): React.JSX.Element {
  const theme = useTheme();
  const size = theme.layout.storyAvatar + theme.layout.storyRingWidth * 2;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
      }}>
      {Array.from({length: count}, (_, index) => (
        <View key={index} style={{alignItems: 'center', gap: theme.spacing.xxs}}>
          <Skeleton width={size} height={size} radius={theme.radius.full} />
          <Skeleton
            width={theme.layout.skeletonLabelWidth}
            height={theme.layout.skeletonLabelHeight}
            radius={theme.radius.sm}
          />
        </View>
      ))}
    </ScrollView>
  );
}

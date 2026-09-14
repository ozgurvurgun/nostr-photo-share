import React, {useMemo} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {Skeleton} from '../../../../shared/ui/Skeleton';

export function StoryRingSkeleton({count = 5}: {readonly count?: number}): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const size = theme.layout.storyAvatar + theme.layout.storyRingWidth * 2;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {Array.from({length: count}, (_, index) => (
        <View key={index} style={styles.item}>
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

function createStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.screenEdge,
    },
    item: {
      alignItems: 'center',
      gap: theme.spacing.xxs,
    },
  });
}

import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {Skeleton} from '../../../../shared/ui/Skeleton';

export function FeedSkeletonList({count = 3}: {readonly count?: number}): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.list}>
      {Array.from({length: count}, (_, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.header}>
            <Skeleton width={40} height={40} radius={theme.radius.full} />
            <View style={styles.headerText}>
              <Skeleton height={12} width="42%" />
              <Skeleton height={10} width="36%" />
            </View>
          </View>
          <Skeleton height={48} width="88%" radius={theme.radius.sm} />
          <Skeleton
            height={theme.layout.feedCardMediaMinHeight}
            radius={theme.radius.md}
          />
          <Skeleton height={14} width="40%" />
        </View>
      ))}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    list: {
      gap: theme.spacing.lg,
      paddingHorizontal: theme.spacing.screenEdge,
    },
    card: {
      borderRadius: theme.radius.md,
      overflow: 'hidden',
      backgroundColor: theme.colors.background.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.subtle,
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
      ...theme.elevation.card,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    headerText: {
      flex: 1,
      gap: theme.spacing.xxs,
    },
  });
}

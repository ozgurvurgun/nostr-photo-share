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
            <Skeleton width={36} height={36} radius={theme.radius.full} />
            <View style={styles.headerText}>
              <Skeleton height={12} width="42%" />
              <Skeleton height={10} width="24%" />
            </View>
          </View>
          <Skeleton height={theme.layout.feedCardMediaMinHeight} radius={0} />
          <View style={styles.body}>
            <Skeleton height={14} width="28%" />
            <Skeleton height={14} width="78%" />
            <Skeleton height={12} width="55%" />
          </View>
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
      borderRadius: theme.radius.lg,
      overflow: 'hidden',
      backgroundColor: theme.colors.background.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.subtle,
      gap: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
      ...theme.elevation.card,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
    },
    headerText: {
      flex: 1,
      gap: theme.spacing.xxs,
    },
    body: {
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
    },
  });
}

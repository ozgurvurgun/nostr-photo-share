import React, {useMemo} from 'react';
import {StyleSheet, useWindowDimensions, View} from 'react-native';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {Skeleton} from '../../../../shared/ui/Skeleton';

const MEDIA_ASPECT = 4 / 5;

export function FeedSkeletonList({count = 3}: {readonly count?: number}): React.JSX.Element {
  const theme = useTheme();
  const {width} = useWindowDimensions();
  const mediaHeight = Math.round(width / MEDIA_ASPECT);
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.list}>
      {Array.from({length: count}, (_, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.pad}>
            <View style={styles.header}>
              <Skeleton width={40} height={40} radius={theme.radius.full} />
              <View style={styles.headerText}>
                <Skeleton height={13} width="38%" />
                <Skeleton height={11} width="52%" />
              </View>
              <Skeleton width={18} height={6} radius={theme.radius.full} />
            </View>
          </View>

          <Skeleton height={mediaHeight} radius={0} />

          <View style={styles.pad}>
            <View style={styles.actions}>
              <View style={styles.actionsLeft}>
                <Skeleton width={22} height={22} radius={theme.radius.sm} />
                <Skeleton width={22} height={22} radius={theme.radius.sm} />
                <Skeleton width={22} height={22} radius={theme.radius.sm} />
              </View>
              <Skeleton width={22} height={22} radius={theme.radius.sm} />
            </View>
            <Skeleton height={12} width="28%" />
            <Skeleton height={14} width="92%" />
            <Skeleton height={14} width="64%" />
            <Skeleton height={10} width="34%" />
          </View>
        </View>
      ))}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    list: {
      backgroundColor: theme.colors.background.primary,
    },
    card: {
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.background.primary,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.default,
    },
    pad: {
      paddingHorizontal: theme.spacing.screenEdge,
      gap: theme.spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    headerText: {
      flex: 1,
      gap: 6,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    actionsLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
  });
}

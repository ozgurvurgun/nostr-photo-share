import React, {useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {MainTabParamList} from '../../../../app/navigation/types';
import {StillHaptics} from '../../../../shared/haptics/haptics';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {EmptyState} from '../../../../shared/ui/EmptyState';
import {Icon} from '../../../../shared/ui/Icon';

export type ActivityScreenProps = BottomTabScreenProps<MainTabParamList, 'Activity'>;

type ActivityTab = 'all' | 'mentions';

export function ActivityScreen(_props: ActivityScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(theme, insets.top),
    [theme, insets.top],
  );
  const [tab, setTab] = useState<ActivityTab>('all');
  const [unread, setUnread] = useState(0);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text accessibilityRole="header" style={styles.title}>
              {t('activity.title')}
            </Text>
            {unread > 0 ? (
              <Text style={styles.subtitle}>
                {t('activity.newCount', {count: unread})}
              </Text>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('activity.markAllRead')}
            onPress={() => {
              StillHaptics.selection();
              setUnread(0);
            }}
            style={({pressed}) => [
              styles.markRead,
              pressed ? styles.pressed : null,
            ]}>
            <Icon name="check" size={14} color={theme.colors.accent.primary} />
            <Text numberOfLines={1} style={styles.markReadLabel}>
              {t('activity.markAllRead')}
            </Text>
          </Pressable>
        </View>
        <View style={styles.tabs}>
          {(['all', 'mentions'] as const).map(item => {
            const selected = tab === item;
            return (
              <Pressable
                key={item}
                accessibilityRole="tab"
                accessibilityState={{selected}}
                onPress={() => {
                  StillHaptics.selection();
                  setTab(item);
                }}
                style={styles.tab}>
                <Text style={[styles.tabLabel, selected ? styles.tabLabelOn : null]}>
                  {item === 'all' ? t('activity.tabAll') : t('activity.tabMentions')}
                </Text>
                {selected ? <View style={styles.tabUnderline} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
      <EmptyState
        title={
          tab === 'mentions'
            ? t('activity.emptyMentionsTitle')
            : t('activity.emptyTitle')
        }
        message={
          tab === 'mentions'
            ? t('activity.emptyMentionsMessage')
            : t('activity.emptyMessage')
        }
      />
    </View>
  );
}

function createStyles(theme: Theme, paddingTop: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
      paddingTop,
    },
    header: {
      paddingHorizontal: theme.spacing.screenEdge,
      paddingTop: theme.spacing.md,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    titleBlock: {
      flex: 1,
      gap: 2,
    },
    title: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.title.fontSize,
      lineHeight: theme.typography.title.lineHeight,
      fontWeight: theme.typography.title.fontWeight,
      letterSpacing: theme.typography.title.letterSpacing,
    },
    subtitle: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
    },
    markRead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderWidth: 1,
      borderColor: theme.colors.accent.primary,
      borderRadius: theme.radius.full,
      paddingHorizontal: theme.spacing.sm,
      minHeight: 32,
      flexShrink: 0,
    },
    markReadLabel: {
      color: theme.colors.text.secondary,
      fontSize: 11,
      fontWeight: '600',
    },
    tabs: {
      flexDirection: 'row',
      gap: theme.spacing.lg,
      marginTop: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.default,
    },
    tab: {
      paddingBottom: theme.spacing.sm,
    },
    tabLabel: {
      color: theme.colors.text.disabled,
      fontWeight: '700',
    },
    tabLabelOn: {
      color: theme.colors.accent.primary,
    },
    tabUnderline: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 2,
      backgroundColor: theme.colors.accent.primary,
      borderRadius: 1,
    },
    pressed: {
      opacity: 0.75,
    },
  });
}

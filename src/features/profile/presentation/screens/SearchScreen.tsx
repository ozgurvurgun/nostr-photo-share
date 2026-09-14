import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {CompositeScreenProps} from '@react-navigation/native';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList, MainTabParamList} from '../../../../app/navigation/types';
import {StillHaptics} from '../../../../shared/haptics/haptics';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {Icon} from '../../../../shared/ui/Icon';
import {SearchBar} from '../../../../shared/ui/SearchBar';
import type {ImagePost} from '../../../feed/domain/ImagePost';
import {PostGrid} from '../../../feed/presentation/components/PostGrid';
import {flattenFeedPosts, useFeed} from '../../../feed/presentation/hooks/useFeed';
import {postDetailParamsFromPost} from '../../../feed/presentation/navigation/postDetailParams';
import {usePostReactions} from '../../../social/presentation/hooks/useReactions';

export type SearchScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Search'>,
  NativeStackScreenProps<AppStackParamList>
>;

type ExploreCategory = 'all' | 'photo' | 'art' | 'tech';

const CATEGORIES: readonly {
  readonly id: ExploreCategory;
  readonly labelKey: string;
  readonly match: RegExp | null;
}[] = [
  {id: 'all', labelKey: 'search.catAll', match: null},
  {id: 'photo', labelKey: 'search.catPhoto', match: /fotoğraf|fotograf|photo|photography/i},
  {id: 'art', labelKey: 'search.catArt', match: /sanat|art|tasarım|tasarim|design/i},
  {id: 'tech', labelKey: 'search.catTech', match: /teknoloji|tech|nostr|yapayzeka|yapay zeka/i},
];

function postMatches(post: ImagePost, query: string, category: ExploreCategory): boolean {
  const haystack = `${post.title} ${post.caption}`;
  const selected = CATEGORIES.find(item => item.id === category);
  if (selected?.match && !selected.match.test(haystack)) {
    return false;
  }
  const needle = query.trim().replace(/^#/, '');
  if (needle.length === 0) {
    return true;
  }
  return haystack.toLocaleLowerCase('tr-TR').includes(needle.toLocaleLowerCase('tr-TR'));
}

export function SearchScreen({navigation, route}: SearchScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(theme, insets.top),
    [theme, insets.top],
  );
  const [query, setQuery] = useState(route.params?.query ?? '');
  const [category, setCategory] = useState<ExploreCategory>('all');

  useEffect(() => {
    const incoming = route.params?.query;
    if (incoming !== undefined) {
      setQuery(incoming.replace(/^#/, ''));
      setCategory('all');
    }
  }, [route.params?.query]);

  const explore = useFeed({});
  const posts = useMemo(
    () => flattenFeedPosts(explore.data?.pages),
    [explore.data?.pages],
  );
  const visible = useMemo(
    () => posts.filter(post => postMatches(post, query, category)),
    [posts, query, category],
  );
  const postIds = useMemo(() => visible.map(post => post.id), [visible]);
  const reactions = usePostReactions(postIds);
  const likedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const [eventId, summary] of reactions.byEventId) {
      if (summary.likedByMe) {
        ids.add(eventId);
      }
    }
    return ids;
  }, [reactions.byEventId]);

  const onPressPost = useCallback(
    (post: ImagePost) => {
      navigation.navigate('PostDetail', postDetailParamsFromPost(post));
    },
    [navigation],
  );

  const onEndReached = useCallback(() => {
    if (explore.hasNextPage && !explore.isFetchingNextPage) {
      explore.fetchNextPage().catch(() => undefined);
    }
  }, [explore]);

  const listHeader = useMemo(
    () => (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}>
        {CATEGORIES.map(item => {
          const selected = category === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{selected}}
              onPress={() => {
                StillHaptics.selection();
                setCategory(item.id);
              }}
              style={[styles.chip, selected ? styles.chipOn : null]}>
              <Text style={[styles.chipLabel, selected ? styles.chipLabelOn : null]}>
                {t(item.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    ),
    [category, styles],
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text accessibilityRole="header" style={styles.title}>
            {t('search.title')}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('search.settingsA11y')}
            onPress={() => navigation.navigate('Account')}
            hitSlop={theme.layout.hitSlop}
            style={({pressed}) => (pressed ? styles.pressed : null)}>
            <Icon name="settings" size={22} color={theme.colors.text.secondary} />
          </Pressable>
        </View>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onClear={() => setQuery('')}
          placeholder={t('search.placeholder')}
          accessibilityLabel={t('search.placeholder')}
        />
      </View>
      <PostGrid
        posts={visible}
        likedIds={likedIds}
        loading={explore.isPending && posts.length === 0}
        refreshing={explore.isRefetching && !explore.isFetchingNextPage}
        onRefresh={() => {
          explore.refetch().catch(() => undefined);
        }}
        onEndReached={onEndReached}
        fetchingMore={explore.isFetchingNextPage}
        error={explore.isError ? (explore.error as Error) : null}
        onRetry={() => {
          explore.refetch().catch(() => undefined);
        }}
        emptyTitle={t('search.exploreEmptyTitle')}
        emptyMessage={t('search.exploreEmptyMessage')}
        onPressPost={onPressPost}
        ListHeaderComponent={listHeader}
        contentPaddingBottom={insets.bottom + theme.spacing.md}
      />
    </View>
  );
}

function createStyles(theme: Theme, insetTop: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
      paddingTop: insetTop + theme.spacing.sm,
    },
    header: {
      paddingHorizontal: theme.spacing.screenEdge,
      paddingBottom: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.display.fontSize,
      lineHeight: theme.typography.display.lineHeight,
      fontWeight: theme.typography.display.fontWeight,
      letterSpacing: theme.typography.display.letterSpacing,
    },
    chips: {
      paddingHorizontal: theme.spacing.screenEdge,
      paddingBottom: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    chip: {
      minHeight: 34,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      backgroundColor: theme.colors.background.elevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipOn: {
      backgroundColor: theme.colors.accent.primary,
      borderColor: theme.colors.accent.primary,
    },
    chipLabel: {
      color: theme.colors.text.secondary,
      fontWeight: '600',
      fontSize: theme.typography.caption.fontSize,
    },
    chipLabelOn: {
      color: theme.colors.accent.onAccent,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}

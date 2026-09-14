import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import type {CompositeScreenProps} from '@react-navigation/native';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {AppStackParamList, MainTabParamList} from '../../../../app/navigation/types';
import {StillHaptics} from '../../../../shared/haptics/haptics';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {EmptyState} from '../../../../shared/ui/EmptyState';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {Icon} from '../../../../shared/ui/Icon';
import {OfflineBanner} from '../../../../shared/ui/OfflineBanner';
import {StillRefreshControl} from '../../../../shared/ui/StillRefreshControl';
import {useAuthSession} from '../../../auth/presentation/hooks/useAuthSession';
import {useFollowList} from '../../../social/presentation/hooks/useFollow';
import {useLikePost, usePostReactions} from '../../../social/presentation/hooks/useReactions';
import {useOutboxDiscovery} from '../../../relays/presentation/hooks/useOutboxDiscovery';
import {StoryRingRow} from '../../../stories/presentation/components/StoryRingRow';
import {
  useActiveStories,
  useStorySeenIds,
} from '../../../stories/presentation/hooks/useStories';
import type {ImagePost} from '../../domain/ImagePost';
import {FeedPostCard} from '../components/FeedPostCard';
import {FeedSkeletonList} from '../components/FeedSkeletonList';
import {flattenFeedPosts, useFeed} from '../hooks/useFeed';
import {useRelayOnline} from '../hooks/useRelayOnline';
import {postDetailParamsFromPost} from '../navigation/postDetailParams';
import type {AuthorStoryStack} from '../../../stories/application/GetActiveStoriesUseCase';

const EMPTY_PUBKEYS: readonly string[] = [];
const EMPTY_STORY_STACKS: readonly AuthorStoryStack[] = [];

type FeedScope = 'forYou' | 'following';

/** Home tab inside MainTabs; stack navigate still reaches App routes. */
export type FeedScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<AppStackParamList>
>;

export function FeedScreen({navigation}: FeedScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(theme, insets.top),
    [theme, insets.top],
  );
  const focused = useIsFocused();
  const {identity} = useAuthSession();
  const online = useRelayOnline(10_000, {enabled: focused});
  const followListQuery = useFollowList();
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  const [scope, setScope] = useState<FeedScope>('forYou');

  useEffect(() => {
    if (!focused) {
      return;
    }
    const id = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 60_000);
    return () => clearInterval(id);
  }, [focused]);

  const selfPubkey = identity?.publicKey.toHex().trim().toLowerCase() ?? '';
  const followListReady = followListQuery.isFetched || followListQuery.isError;
  const followed = useMemo(
    () => followListQuery.data?.followedPubkeys() ?? EMPTY_PUBKEYS,
    [followListQuery.data],
  );
  const hasFollows = followed.length > 0;
  const feedAuthors = useMemo(() => {
    if (!followListReady || !hasFollows || selfPubkey.length === 0) {
      return undefined;
    }
    return [...new Set([...followed, selfPubkey])];
  }, [followListReady, followed, hasFollows, selfPubkey]);

  const storyAuthors = feedAuthors;
  useOutboxDiscovery(hasFollows ? followed : EMPTY_PUBKEYS);

  const sessionReady = Boolean(identity) && followListReady;
  const forYouFeed = useFeed({
    enabled: sessionReady && scope === 'forYou',
  });
  const followingFeed = useFeed({
    authors: feedAuthors,
    enabled: sessionReady && scope === 'following' && Boolean(feedAuthors),
  });
  const feed = scope === 'following' ? followingFeed : forYouFeed;
  const stories = useActiveStories({
    authors: storyAuthors,
    enabled: sessionReady,
    refetchIntervalMs: focused ? 60_000 : false,
  });
  const seenIds = useStorySeenIds();
  const likeMutation = useLikePost();

  const posts = useMemo(() => flattenFeedPosts(feed.data?.pages), [feed.data?.pages]);
  const postIds = useMemo(() => posts.map(post => post.id), [posts]);
  const reactions = usePostReactions(postIds);

  const fromCache =
    (feed.data?.pages.some(page => page.fromCache) ?? false) ||
    (stories.data?.fromCache ?? false) ||
    reactions.fromCache;
  const followingEmptyGraph = scope === 'following' && !hasFollows && followListReady;
  const isInitialLoading =
    !followingEmptyGraph &&
    (!followListReady || feed.isPending) &&
    posts.length === 0;
  const isFatalError =
    !followingEmptyGraph && feed.isError && posts.length === 0 && followListReady;
  const showInlineError = feed.isError && posts.length > 0;
  const storyStacks = useMemo(
    () => stories.data?.byAuthor ?? EMPTY_STORY_STACKS,
    [stories.data?.byAuthor],
  );
  const storiesPending = stories.isPending && storyStacks.length === 0;
  const storiesError =
    stories.isError && storyStacks.length === 0
      ? stories.error instanceof Error
        ? stories.error.message
        : t('feed.storiesUnavailableFallback')
      : null;
  const feedErrorMessage =
    feed.error instanceof Error ? feed.error.message : t('feed.feedUpdateFailedFallback');

  const onRefresh = useCallback(() => {
    feed.refetch().catch(() => undefined);
    followListQuery.refetch().catch(() => undefined);
    stories.refetch().catch(() => undefined);
  }, [feed, followListQuery, stories]);

  const onEndReached = useCallback(() => {
    if (feed.hasNextPage && !feed.isFetchingNextPage) {
      feed.fetchNextPage().catch(() => undefined);
    }
  }, [feed]);

  const onAuthorPress = useCallback(
    (pubkeyHex: string) => {
      navigation.navigate('Profile', {pubkeyHex});
    },
    [navigation],
  );

  const onLikePress = useCallback(
    (post: ImagePost) => {
      likeMutation.mutate({
        eventId: post.id,
        authorPubkeyHex: post.authorPubkeyHex,
      });
    },
    [likeMutation],
  );

  const onCommentPress = useCallback(
    (post: ImagePost) => {
      navigation.navigate(
        'PostDetail',
        postDetailParamsFromPost(post, {openComments: true}),
      );
    },
    [navigation],
  );

  const onCreateStory = useCallback(() => {
    navigation.navigate('CreateStory');
  }, [navigation]);

  const onOpenAuthorStory = useCallback(
    (authorPubkeyHex: string) => {
      navigation.navigate('StoryViewer', {
        authorPubkeyHex,
        authorQueue: storyStacks.map(stack => stack.authorPubkeyHex),
      });
    },
    [navigation, storyStacks],
  );

  const onRetryStories = useCallback(() => {
    stories.refetch().catch(() => undefined);
  }, [stories]);

  const onRetryFeed = useCallback(() => {
    feed.refetch().catch(() => undefined);
  }, [feed]);

  const onSelectScope = useCallback((next: FeedScope) => {
    StillHaptics.selection();
    setScope(next);
  }, []);

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
        <StoryRingRow
          stacks={storyStacks}
          seenIds={seenIds}
          selfPubkeyHex={selfPubkey}
          loading={storiesPending}
          onCreateStory={onCreateStory}
          onOpenAuthor={onOpenAuthorStory}
        />
        {storiesError ? (
          <View style={styles.headerError}>
            <ErrorState
              title={t('feed.storiesUnavailable')}
              message={storiesError}
              onRetry={onRetryStories}
            />
          </View>
        ) : null}
        {showInlineError ? (
          <View style={styles.headerError}>
            <ErrorState
              title={t('feed.feedUpdateFailed')}
              message={feedErrorMessage}
              onRetry={onRetryFeed}
            />
          </View>
        ) : null}
      </View>
    ),
    [
      styles.listHeader,
      styles.headerError,
      storyStacks,
      seenIds,
      selfPubkey,
      storiesPending,
      storiesError,
      showInlineError,
      feedErrorMessage,
      onCreateStory,
      onOpenAuthorStory,
      onRetryStories,
      onRetryFeed,
    ],
  );

  const pendingLikeId = likeMutation.isPending
    ? likeMutation.variables?.eventId
    : undefined;

  const renderItem = useCallback(
    ({item}: {item: ImagePost}) => (
      <FeedPostCard
        post={item}
        variant="detail"
        reaction={reactions.byEventId.get(item.id)}
        likePending={pendingLikeId === item.id}
        nowSec={nowSec}
        onAuthorPress={onAuthorPress}
        onLikePress={onLikePress}
        onCommentPress={onCommentPress}
      />
    ),
    [
      reactions.byEventId,
      pendingLikeId,
      nowSec,
      onAuthorPress,
      onLikePress,
      onCommentPress,
    ],
  );

  if (!identity) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.accent.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <OfflineBanner visible={!online || fromCache} stale={fromCache} />

      <View style={styles.topBar}>
        <Text
          accessibilityRole="header"
          accessibilityLabel={t('brand')}
          style={styles.brand}>
          {t('brand')}
        </Text>
        <View style={styles.topActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('feed.searchA11y')}
            onPress={() => navigation.navigate('SearchLookup')}
            hitSlop={theme.layout.hitSlop}
            style={({pressed}) => [
              styles.headerIcon,
              pressed ? styles.pressed : null,
            ]}>
            <Icon name="search" size={22} color={theme.colors.text.primary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('feed.messagesA11y')}
            onPress={() => navigation.navigate('Messages')}
            hitSlop={theme.layout.hitSlop}
            style={({pressed}) => [
              styles.headerIcon,
              pressed ? styles.pressed : null,
            ]}>
            <Icon name="message" size={22} color={theme.colors.text.primary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.scopeRow}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{selected: scope === 'forYou'}}
          onPress={() => onSelectScope('forYou')}
          style={({pressed}) => (pressed ? styles.pressed : null)}>
          <Text
            style={[
              styles.scopeLabel,
              scope === 'forYou' ? styles.scopeLabelActive : null,
            ]}>
            {t('feed.forYou')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{selected: scope === 'following'}}
          onPress={() => onSelectScope('following')}
          style={({pressed}) => (pressed ? styles.pressed : null)}>
          <Text
            style={[
              styles.scopeLabel,
              scope === 'following' ? styles.scopeLabelActive : null,
            ]}>
            {t('feed.following')}
          </Text>
        </Pressable>
      </View>

      {isFatalError ? (
        <View style={styles.fatal}>
          {listHeader}
          <ErrorState
            title={t('feed.loadFailed')}
            message={
              feed.error instanceof Error ? feed.error.message : t('common.unknownError')
            }
            onRetry={onRetryFeed}
          />
        </View>
      ) : (
        <FlatList
          data={followingEmptyGraph ? [] : posts}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          windowSize={5}
          maxToRenderPerBatch={3}
          initialNumToRender={3}
          updateCellsBatchingPeriod={80}
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={
            <StillRefreshControl
              refreshing={feed.isRefetching && !feed.isFetchingNextPage}
              onRefresh={onRefresh}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            isInitialLoading ? (
              <FeedSkeletonList />
            ) : (
              <EmptyState
                title={
                  followingEmptyGraph
                    ? t('feed.followingEmptyTitle')
                    : t('feed.emptyTitle')
                }
                message={
                  followingEmptyGraph
                    ? t('feed.followingEmptyMessage')
                    : hasFollows || scope === 'following'
                      ? t('feed.emptyFollows')
                      : t('feed.emptyGlobal')
                }
                actionLabel={
                  followingEmptyGraph ? t('search.explore') : t('feed.createPost')
                }
                onAction={() =>
                  followingEmptyGraph
                    ? navigation.navigate('Search')
                    : navigation.navigate('CreatePost')
                }
              />
            )
          }
          ListFooterComponent={
            feed.isFetchingNextPage ? (
              <ActivityIndicator
                color={theme.colors.accent.primary}
                style={styles.footerSpinner}
              />
            ) : undefined
          }
          renderItem={renderItem}
        />
      )}
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
    centered: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: theme.colors.background.primary,
      padding: theme.spacing.screenEdge,
    },
    topBar: {
      paddingHorizontal: theme.spacing.screenEdge,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    brand: {
      color: theme.colors.text.primary,
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700',
      fontStyle: 'italic',
      letterSpacing: -0.3,
    },
    topActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xxs,
    },
    headerIcon: {
      width: theme.layout.headerControlSize,
      height: theme.layout.headerControlSize,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scopeRow: {
      paddingHorizontal: theme.spacing.screenEdge,
      paddingBottom: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    scopeLabel: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodyStrong.fontSize,
      lineHeight: theme.typography.bodyStrong.lineHeight,
      fontWeight: '500',
    },
    scopeLabelActive: {
      color: theme.colors.text.primary,
      fontWeight: theme.typography.bodyStrong.fontWeight,
    },
    listHeader: {
      gap: theme.spacing.md,
      paddingBottom: theme.spacing.md,
    },
    headerError: {
      paddingHorizontal: theme.spacing.screenEdge,
    },
    listContent: {
      paddingTop: theme.spacing.xs,
      paddingBottom: theme.spacing.lg,
      flexGrow: 1,
    },
    fatal: {
      padding: theme.spacing.screenEdge,
      gap: theme.spacing.md,
    },
    footerSpinner: {
      marginVertical: theme.spacing.md,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}

import React, {useCallback, useMemo} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../../../../app/navigation/types';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import {EmptyState} from '../../../../shared/ui/EmptyState';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {Icon} from '../../../../shared/ui/Icon';
import {OfflineBanner} from '../../../../shared/ui/OfflineBanner';
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
import type {AuthorStoryStack} from '../../../stories/application/GetActiveStoriesUseCase';

const EMPTY_PUBKEYS: readonly string[] = [];
const EMPTY_STORY_STACKS: readonly AuthorStoryStack[] = [];

/** Home tab inside MainTabs; stack navigate still reaches App routes. */
export type FeedScreenProps = {
  navigation: NativeStackNavigationProp<AppStackParamList>;
};

export function FeedScreen({navigation}: FeedScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const {identity} = useAuthSession();
  const online = useRelayOnline(2_000, {enabled: focused});
  const followListQuery = useFollowList();

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

  const feed = useFeed({
    authors: feedAuthors,
    enabled: Boolean(identity) && followListReady,
  });
  const stories = useActiveStories({
    authors: storyAuthors,
    enabled: Boolean(identity) && followListReady,
    refetchIntervalMs: focused ? 30_000 : false,
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
  const isInitialLoading =
    (!followListReady || feed.isPending) && posts.length === 0;
  const isFatalError = feed.isError && posts.length === 0 && followListReady;
  const showInlineError = feed.isError && posts.length > 0;
  const storyStacks = useMemo(
    () => stories.data?.byAuthor ?? EMPTY_STORY_STACKS,
    [stories.data?.byAuthor],
  );

  const onRefresh = useCallback(() => {
    void feed.refetch();
    void followListQuery.refetch();
    void stories.refetch();
  }, [feed, followListQuery, stories]);

  const onEndReached = useCallback(() => {
    if (feed.hasNextPage && !feed.isFetchingNextPage) {
      void feed.fetchNextPage();
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
      navigation.navigate('PostDetail', {
        eventId: post.id,
        authorPubkeyHex: post.authorPubkeyHex,
      });
    },
    [navigation],
  );

  const listHeader = useMemo(
    () => (
      <View style={{gap: theme.spacing.md, paddingBottom: theme.spacing.sm}}>
        <StoryRingRow
          stacks={storyStacks}
          seenIds={seenIds}
          selfPubkeyHex={selfPubkey}
          loading={stories.isPending && storyStacks.length === 0}
          onCreateStory={() => navigation.navigate('CreateStory')}
          onOpenAuthor={authorPubkeyHex =>
            navigation.navigate('StoryViewer', {authorPubkeyHex})
          }
        />
        {stories.isError && storyStacks.length === 0 ? (
          <ErrorState
            title={t('feed.storiesUnavailable')}
            message={
              stories.error instanceof Error
                ? stories.error.message
                : t('feed.storiesUnavailableFallback')
            }
            onRetry={() => {
              void stories.refetch();
            }}
          />
        ) : null}
        {showInlineError ? (
          <ErrorState
            title={t('feed.feedUpdateFailed')}
            message={
              feed.error instanceof Error
                ? feed.error.message
                : t('feed.feedUpdateFailedFallback')
            }
            onRetry={() => {
              void feed.refetch();
            }}
          />
        ) : null}
      </View>
    ),
    [
      theme.spacing.md,
      theme.spacing.sm,
      storyStacks,
      seenIds,
      selfPubkey,
      stories,
      navigation,
      showInlineError,
      feed,
    ],
  );

  const renderItem = useCallback(
    ({item}: {item: ImagePost}) => (
      <FeedPostCard
        post={item}
        reaction={reactions.byEventId.get(item.id)}
        likePending={
          likeMutation.isPending && likeMutation.variables?.eventId === item.id
        }
        onAuthorPress={onAuthorPress}
        onLikePress={onLikePress}
        onCommentPress={onCommentPress}
      />
    ),
    [
      reactions.byEventId,
      likeMutation.isPending,
      likeMutation.variables?.eventId,
      onAuthorPress,
      onLikePress,
      onCommentPress,
    ],
  );

  if (!identity) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          backgroundColor: theme.colors.background.primary,
          padding: theme.spacing.screenEdge,
        }}>
        <ActivityIndicator color={theme.colors.accent.primary} />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background.primary,
        paddingTop: insets.top,
      }}>
      <OfflineBanner visible={!online || fromCache} stale={fromCache} />

      <View
        style={{
          paddingHorizontal: theme.spacing.screenEdge,
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <Text
          accessibilityRole="header"
          accessibilityLabel={t('brand')}
          style={{
            color: theme.colors.text.primary,
            fontSize: theme.typography.display.fontSize,
            lineHeight: theme.typography.display.lineHeight,
            fontWeight: theme.typography.display.fontWeight,
          }}>
          {t('brand')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('createPost.title')}
          onPress={() => navigation.navigate('CreatePost')}
          hitSlop={theme.layout.hitSlop}
          style={({pressed}) => ({opacity: pressed ? 0.7 : 1})}>
          <Icon name="plus" size={28} color={theme.colors.text.primary} />
        </Pressable>
      </View>

      {!hasFollows && !followListQuery.isPending ? (
        <Text
          style={{
            paddingHorizontal: theme.spacing.screenEdge,
            paddingBottom: theme.spacing.sm,
            color: theme.colors.text.secondary,
            fontSize: theme.typography.caption.fontSize,
            lineHeight: theme.typography.caption.lineHeight,
          }}>
          {t('feed.globalHint')}
        </Text>
      ) : null}

      {isFatalError ? (
        <View style={{padding: theme.spacing.screenEdge, gap: theme.spacing.md}}>
          {listHeader}
          <ErrorState
            title={t('feed.loadFailed')}
            message={
              feed.error instanceof Error ? feed.error.message : t('common.unknownError')
            }
            onRetry={() => {
              void feed.refetch();
            }}
          />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          contentContainerStyle={{
            paddingBottom: theme.spacing.lg,
            gap: theme.spacing.xl,
            flexGrow: 1,
          }}
          windowSize={5}
          maxToRenderPerBatch={4}
          initialNumToRender={4}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={
            <RefreshControl
              refreshing={feed.isRefetching && !feed.isFetchingNextPage}
              onRefresh={onRefresh}
              tintColor={theme.colors.accent.primary}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            isInitialLoading ? (
              <FeedSkeletonList />
            ) : (
              <EmptyState
                title={t('feed.emptyTitle')}
                message={hasFollows ? t('feed.emptyFollows') : t('feed.emptyGlobal')}
                actionLabel={t('feed.createPost')}
                onAction={() => navigation.navigate('CreatePost')}
              />
            )
          }
          ListFooterComponent={
            feed.isFetchingNextPage ? (
              <ActivityIndicator
                color={theme.colors.accent.primary}
                style={{marginVertical: theme.spacing.md}}
              />
            ) : undefined
          }
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../../../../app/navigation/types';
import {hostFromRelayUrl} from '../../../../shared/format';
import {StillHaptics} from '../../../../shared/haptics/haptics';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {ScreenHeader} from '../../../../shared/ui/ScreenHeader';
import {useAuthSession} from '../../../auth/presentation/hooks/useAuthSession';
import {FeedPostCard} from '../../../feed/presentation/components/FeedPostCard';
import {flattenFeedPosts, useFeed} from '../../../feed/presentation/hooks/useFeed';
import {imagePostFromDetailParams} from '../../../feed/presentation/navigation/postDetailParams';
import {useRelayList} from '../../../relays/presentation/hooks/useRelays';
import type {ImagePost} from '../../../feed/domain/ImagePost';
import type {Comment} from '../../domain/Comment';
import {useCommentOnPost, useComments} from '../hooks/useComments';
import {useLikePost, usePostReactions} from '../hooks/useReactions';
import {CommentsSheet} from './CommentsSheet';

export type PostDetailScreenProps = NativeStackScreenProps<AppStackParamList, 'PostDetail'>;

export function PostDetailScreen({
  navigation,
  route,
}: PostDetailScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(theme, insets.bottom),
    [theme, insets.bottom],
  );
  const {identity} = useAuthSession();
  const selfPubkey = identity?.publicKey.toHex() ?? '';
  const relayList = useRelayList(selfPubkey.length > 0 ? selfPubkey : undefined);
  const relayHost = useMemo(() => {
    const url = relayList.data?.preferences[0]?.url;
    return url ? hostFromRelayUrl(url) : undefined;
  }, [relayList.data]);

  const authorOnly = route.params.authorFeed === true;
  const authorPubkeyHex = route.params.authorPubkeyHex.trim().toLowerCase();

  const snapshot = useMemo(
    () => imagePostFromDetailParams(route.params),
    [route.params],
  );
  const feed = useFeed({
    authors: authorOnly && authorPubkeyHex.length > 0 ? [authorPubkeyHex] : undefined,
  });
  const feedPosts = useMemo(() => {
    const all = flattenFeedPosts(feed.data?.pages);
    if (!authorOnly || authorPubkeyHex.length === 0) {
      return all;
    }
    return all.filter(post => post.authorPubkeyHex === authorPubkeyHex);
  }, [authorOnly, authorPubkeyHex, feed.data?.pages]);

  const posts = useMemo(() => {
    const rest = feedPosts.filter(
      post =>
        post.id !== snapshot?.id &&
        (snapshot === null || post.createdAt <= snapshot.createdAt),
    );
    return snapshot ? [snapshot, ...rest] : rest;
  }, [feedPosts, snapshot]);

  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 60_000);
    return () => clearInterval(id);
  }, []);

  const [sheetPost, setSheetPost] = useState<ImagePost | null>(() =>
    route.params.openComments ? snapshot : null,
  );
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);

  const commentsQuery = useComments(sheetPost?.id ?? '');
  const commentMutation = useCommentOnPost();
  const likeMutation = useLikePost();
  const reactionIds = useMemo(() => posts.map(post => post.id), [posts]);
  const reactions = usePostReactions(reactionIds);
  const comments = commentsQuery.data?.comments ?? [];

  const onAuthorPress = useCallback(
    (pubkeyHex: string) => {
      navigation.navigate('Profile', {pubkeyHex});
    },
    [navigation],
  );

  const onLikePress = useCallback(
    (likedPost: ImagePost) => {
      likeMutation.mutate({
        eventId: likedPost.id,
        authorPubkeyHex: likedPost.authorPubkeyHex,
      });
    },
    [likeMutation],
  );

  const openComments = useCallback((post: ImagePost) => {
    setReplyTo(null);
    setDraft('');
    setSheetPost(post);
  }, []);

  async function onSubmit(): Promise<void> {
    const content = draft.trim();
    const target = sheetPost;
    if (content.length === 0 || commentMutation.isPending || !target) {
      return;
    }
    try {
      await commentMutation.mutateAsync({
        content,
        rootEventId: target.id,
        rootAuthorPubkeyHex: target.authorPubkeyHex,
        ...(replyTo
          ? {
              parentEventId: replyTo.id,
              parentAuthorPubkeyHex: replyTo.authorPubkeyHex,
              parentKind: 1111,
            }
          : {}),
      });
      StillHaptics.selection();
      setDraft('');
      setReplyTo(null);
    } catch {
      StillHaptics.error();
    }
  }

  async function onShareFocused(): Promise<void> {
    const post = snapshot ?? posts[0];
    if (!post) {
      return;
    }
    try {
      await Share.share({
        message: post.media.url,
        url: post.media.url,
        title: post.title,
      });
    } catch {
      // cancelled
    }
  }

  const onEndReached = useCallback(() => {
    if (feed.hasNextPage && !feed.isFetchingNextPage) {
      feed.fetchNextPage().catch(() => undefined);
    }
  }, [feed]);

  const pendingLikeId = likeMutation.isPending
    ? likeMutation.variables?.eventId
    : undefined;

  const renderItem = useCallback(
    ({item}: {item: ImagePost}) => (
      <FeedPostCard
        post={item}
        variant="detail"
        relayHost={relayHost}
        reaction={reactions.byEventId.get(item.id)}
        likePending={pendingLikeId === item.id}
        nowSec={nowSec}
        onAuthorPress={onAuthorPress}
        onLikePress={onLikePress}
        onCommentPress={openComments}
      />
    ),
    [
      nowSec,
      onAuthorPress,
      onLikePress,
      openComments,
      pendingLikeId,
      reactions.byEventId,
      relayHost,
    ],
  );

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={t('comments.postTitle')}
        onBack={() => navigation.goBack()}
        rightIcon="share"
        rightLabel={t('comments.shareA11y')}
        onRightPress={() => {
          onShareFocused().catch(() => undefined);
        }}
      />
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.list}
        windowSize={5}
        maxToRenderPerBatch={4}
        initialNumToRender={2}
        ListFooterComponent={
          feed.isFetchingNextPage ? (
            <ActivityIndicator
              color={theme.colors.accent.primary}
              style={styles.footer}
            />
          ) : undefined
        }
      />

      <CommentsSheet
        visible={sheetPost !== null}
        onClose={() => {
          setSheetPost(null);
          setReplyTo(null);
          setDraft('');
        }}
        comments={comments}
        loading={commentsQuery.isPending}
        error={
          commentsQuery.isError && commentsQuery.error instanceof Error
            ? commentsQuery.error
            : null
        }
        onRetry={() => {
          commentsQuery.refetch().catch(() => undefined);
        }}
        draft={draft}
        onChangeDraft={setDraft}
        onSubmit={() => {
          onSubmit().catch(() => undefined);
        }}
        submitting={commentMutation.isPending}
        replyTo={replyTo}
        onReply={setReplyTo}
        onCancelReply={() => setReplyTo(null)}
        nowSec={nowSec}
      />
    </View>
  );
}

function createStyles(theme: Theme, _insetBottom: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    list: {
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.lg,
    },
    footer: {
      paddingVertical: theme.spacing.md,
    },
  });
}

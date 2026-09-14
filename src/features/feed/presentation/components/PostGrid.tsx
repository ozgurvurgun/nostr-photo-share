import React, {useCallback, useMemo} from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {useWindowDimensions} from 'react-native';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {CachedImage} from '../../../../shared/ui/CachedImage';
import {EmptyState} from '../../../../shared/ui/EmptyState';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {Icon} from '../../../../shared/ui/Icon';
import {Skeleton} from '../../../../shared/ui/Skeleton';
import {StillRefreshControl} from '../../../../shared/ui/StillRefreshControl';
import type {ImagePost} from '../../domain/ImagePost';

const COLUMNS = 3;
const GAP = 2;

export type PostGridProps = {
  readonly posts: readonly ImagePost[];
  readonly loading?: boolean;
  readonly refreshing?: boolean;
  readonly onRefresh?: () => void;
  readonly onEndReached?: () => void;
  readonly fetchingMore?: boolean;
  readonly error?: Error | null;
  readonly onRetry?: () => void;
  readonly emptyTitle: string;
  readonly emptyMessage: string;
  readonly onPressPost: (post: ImagePost) => void;
  readonly ListHeaderComponent?: React.ReactElement | undefined;
  readonly likedIds?: ReadonlySet<string>;
  readonly contentPaddingTop?: number;
  readonly contentPaddingBottom?: number;
};

function GridCell({
  post,
  size,
  liked,
  onPress,
}: {
  readonly post: ImagePost;
  readonly size: number;
  readonly liked: boolean;
  readonly onPress: (post: ImagePost) => void;
}): React.JSX.Element {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={post.title || t('feed.gridCellA11y')}
      onPress={() => onPress(post)}
      style={{
        width: size,
        height: size,
        backgroundColor: theme.colors.background.elevated,
      }}>
      <CachedImage
        uri={post.media.url}
        blurhash={post.media.blurhash}
        resizeMode="cover"
      />
      {liked ? (
        <View style={styles.likeBadge} pointerEvents="none">
          <Icon name="heartFill" size={16} color="#FFFFFF" />
        </View>
      ) : null}
    </Pressable>
  );
}

const MemoGridCell = React.memo(GridCell);

function GridSkeleton({size, theme}: {readonly size: number; readonly theme: Theme}) {
  const cells = useMemo(() => Array.from({length: 9}, (_, i) => i), []);
  return (
    <View style={styles.skeletonGrid}>
      {cells.map(i => (
        <Skeleton
          key={i}
          width={size}
          height={size}
          radius={0}
          style={{backgroundColor: theme.colors.background.elevated}}
        />
      ))}
    </View>
  );
}

/**
 * Instagram-style 3-column square post grid (explore / profile).
 */
export function PostGrid({
  posts,
  loading = false,
  refreshing = false,
  onRefresh,
  onEndReached,
  fetchingMore = false,
  error = null,
  onRetry,
  emptyTitle,
  emptyMessage,
  onPressPost,
  ListHeaderComponent,
  likedIds,
  contentPaddingTop = 0,
  contentPaddingBottom = 0,
}: PostGridProps): React.JSX.Element {
  const theme = useTheme();
  const {width} = useWindowDimensions();
  const size = useMemo(
    () => Math.floor((width - GAP * (COLUMNS - 1)) / COLUMNS),
    [width],
  );

  const renderItem = useCallback(
    ({item}: {item: ImagePost}) => (
      <MemoGridCell
        post={item}
        size={size}
        liked={likedIds?.has(item.id) === true}
        onPress={onPressPost}
      />
    ),
    [likedIds, onPressPost, size],
  );

  const contentStyle = useMemo(
    () => ({
      paddingTop: contentPaddingTop,
      paddingBottom: contentPaddingBottom,
      gap: GAP,
      flexGrow: 1 as const,
    }),
    [contentPaddingTop, contentPaddingBottom],
  );

  const getItemLayout = useCallback(
    (_data: ArrayLike<ImagePost> | null | undefined, index: number) => {
      const row = Math.floor(index / COLUMNS);
      const rowStride = size + GAP;
      return {
        length: size,
        offset: row * rowStride,
        index,
      };
    },
    [size],
  );

  if (error && posts.length === 0) {
    return (
      <View style={[styles.flex, {padding: theme.spacing.screenEdge}]}>
        {ListHeaderComponent}
        <ErrorState
          title={t('feed.loadFailed')}
          message={error.message || t('common.unknownError')}
          onRetry={onRetry}
        />
      </View>
    );
  }

  return (
    <FlatList
      data={posts as ImagePost[]}
      keyExtractor={item => item.id}
      numColumns={COLUMNS}
      columnWrapperStyle={styles.column}
      contentContainerStyle={contentStyle}
      getItemLayout={getItemLayout}
      windowSize={5}
      maxToRenderPerBatch={6}
      initialNumToRender={9}
      removeClippedSubviews
      updateCellsBatchingPeriod={80}
      refreshControl={
        onRefresh ? (
          <StillRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={ListHeaderComponent ?? undefined}
      ListEmptyComponent={
        loading ? (
          <GridSkeleton size={size} theme={theme} />
        ) : (
          <EmptyState title={emptyTitle} message={emptyMessage} />
        )
      }
      ListFooterComponent={
        fetchingMore ? (
          <View style={styles.footer}>
            <Skeleton width={size} height={size} radius={0} />
          </View>
        ) : undefined
      }
      renderItem={renderItem}
    />
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  column: {gap: GAP},
  likeBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  footer: {
    paddingVertical: 8,
    alignItems: 'center',
  },
});

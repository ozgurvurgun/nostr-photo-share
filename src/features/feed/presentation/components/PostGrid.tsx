import React, {useCallback, useMemo} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import {EmptyState} from '../../../../shared/ui/EmptyState';
import {ErrorState} from '../../../../shared/ui/ErrorState';
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
  readonly contentPaddingTop?: number;
  readonly contentPaddingBottom?: number;
};

function cellSize(): number {
  const width = Dimensions.get('window').width;
  return Math.floor((width - GAP * (COLUMNS - 1)) / COLUMNS);
}

function GridCell({
  post,
  size,
  onPress,
}: {
  readonly post: ImagePost;
  readonly size: number;
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
      <Image
        source={{uri: post.media.url}}
        style={{width: '100%', height: '100%'}}
        resizeMode="cover"
      />
    </Pressable>
  );
}

const MemoGridCell = React.memo(GridCell);

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
  contentPaddingTop = 0,
  contentPaddingBottom = 0,
}: PostGridProps): React.JSX.Element {
  const theme = useTheme();
  const size = useMemo(() => cellSize(), []);

  const renderItem = useCallback(
    ({item}: {item: ImagePost}) => (
      <MemoGridCell post={item} size={size} onPress={onPressPost} />
    ),
    [onPressPost, size],
  );

  if (error && posts.length === 0) {
    return (
      <View style={{flex: 1, padding: theme.spacing.screenEdge}}>
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
      columnWrapperStyle={{gap: GAP}}
      contentContainerStyle={{
        paddingTop: contentPaddingTop,
        paddingBottom: contentPaddingBottom,
        gap: GAP,
        flexGrow: 1,
      }}
      windowSize={7}
      maxToRenderPerBatch={9}
      initialNumToRender={12}
      removeClippedSubviews
      updateCellsBatchingPeriod={50}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent.primary}
          />
        ) : undefined
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      ListHeaderComponent={ListHeaderComponent ?? undefined}
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator
            color={theme.colors.accent.primary}
            style={{marginTop: theme.spacing.xl}}
          />
        ) : (
          <View style={{padding: theme.spacing.screenEdge}}>
            <EmptyState title={emptyTitle} message={emptyMessage} />
          </View>
        )
      }
      ListFooterComponent={
        fetchingMore ? (
          <ActivityIndicator
            color={theme.colors.accent.primary}
            style={{marginVertical: theme.spacing.md}}
          />
        ) : undefined
      }
      renderItem={renderItem}
      ListFooterComponentStyle={{paddingBottom: theme.spacing.sm}}
    />
  );
}

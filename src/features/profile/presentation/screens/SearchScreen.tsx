import React, {useCallback, useMemo, useState} from 'react';
import {Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {CompositeScreenProps} from '@react-navigation/native';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useAppContainer} from '../../../../app/providers/AppContainerContext';
import type {AppStackParamList, MainTabParamList} from '../../../../app/navigation/types';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import {Button} from '../../../../shared/ui/Button';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {TextField} from '../../../../shared/ui/TextField';
import type {ImagePost} from '../../../feed/domain/ImagePost';
import {PostGrid} from '../../../feed/presentation/components/PostGrid';
import {flattenFeedPosts, useFeed} from '../../../feed/presentation/hooks/useFeed';

export type SearchScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Search'>,
  NativeStackScreenProps<AppStackParamList>
>;

/**
 * Explore grid + npub/hex profile lookup.
 */
export function SearchScreen({navigation}: SearchScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const container = useAppContainer();
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const explore = useFeed({});
  const posts = useMemo(
    () => flattenFeedPosts(explore.data?.pages),
    [explore.data?.pages],
  );

  const canSubmit = useMemo(() => query.trim().length > 0, [query]);

  const onOpen = useCallback((): void => {
    setError(null);
    const raw = query.trim();
    if (raw.length === 0) {
      return;
    }

    const lower = raw.toLowerCase();
    if (/^[0-9a-f]{64}$/.test(lower)) {
      navigation.navigate('Profile', {pubkeyHex: lower});
      return;
    }

    const decoded = container.nip19.decode(raw);
    if (decoded.ok && decoded.value.type === 'npub') {
      navigation.navigate('Profile', {pubkeyHex: decoded.value.data});
      return;
    }
    if (decoded.ok && decoded.value.type === 'nprofile') {
      navigation.navigate('Profile', {pubkeyHex: decoded.value.data.pubkey});
      return;
    }

    setError(t('search.invalid'));
  }, [query, navigation, container.nip19]);

  const onPressPost = useCallback(
    (post: ImagePost) => {
      navigation.navigate('PostDetail', {
        eventId: post.id,
        authorPubkeyHex: post.authorPubkeyHex,
      });
    },
    [navigation],
  );

  const onEndReached = useCallback(() => {
    if (explore.hasNextPage && !explore.isFetchingNextPage) {
      void explore.fetchNextPage();
    }
  }, [explore]);

  const header = useMemo(
    () => (
      <View
        style={{
          paddingHorizontal: theme.spacing.screenEdge,
          paddingBottom: theme.spacing.md,
          gap: theme.spacing.sm,
        }}>
        <Text
          accessibilityRole="header"
          style={{
            color: theme.colors.text.primary,
            fontSize: theme.typography.title.fontSize,
            lineHeight: theme.typography.title.lineHeight,
            fontWeight: theme.typography.title.fontWeight,
          }}>
          {t('search.title')}
        </Text>
        <TextField
          label={t('search.subtitle')}
          value={query}
          onChangeText={text => {
            setQuery(text);
            setError(null);
          }}
          placeholder={t('search.placeholder')}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {error ? <ErrorState title={t('search.invalid')} message={error} /> : null}
        <Button
          label={t('search.openProfile')}
          disabled={!canSubmit}
          onPress={onOpen}
          variant="secondary"
        />
        <Text
          style={{
            marginTop: theme.spacing.xs,
            color: theme.colors.text.secondary,
            fontSize: theme.typography.heading.fontSize,
            fontWeight: theme.typography.heading.fontWeight,
          }}>
          {t('search.explore')}
        </Text>
      </View>
    ),
    [theme, query, error, canSubmit, onOpen],
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background.primary,
        paddingTop: insets.top + theme.spacing.md,
      }}>
      <PostGrid
        posts={posts}
        loading={explore.isPending && posts.length === 0}
        refreshing={explore.isRefetching && !explore.isFetchingNextPage}
        onRefresh={() => {
          void explore.refetch();
        }}
        onEndReached={onEndReached}
        fetchingMore={explore.isFetchingNextPage}
        error={explore.isError ? (explore.error as Error) : null}
        onRetry={() => {
          void explore.refetch();
        }}
        emptyTitle={t('search.exploreEmptyTitle')}
        emptyMessage={t('search.exploreEmptyMessage')}
        onPressPost={onPressPost}
        ListHeaderComponent={header}
        contentPaddingBottom={insets.bottom + theme.spacing.md}
      />
    </View>
  );
}

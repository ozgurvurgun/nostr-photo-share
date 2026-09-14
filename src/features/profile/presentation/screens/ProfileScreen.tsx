import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {ImageStyle as FastImageStyle} from '@d11/react-native-fast-image';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAppContainer} from '../../../../app/providers/AppContainerContext';
import type {AppStackParamList} from '../../../../app/navigation/types';
import {useAuthSession} from '../../../auth/presentation/hooks/useAuthSession';
import {
  useFollowList,
  useToggleFollow,
} from '../../../social/presentation/hooks/useFollow';
import type {ImagePost} from '../../../feed/domain/ImagePost';
import {PostGrid} from '../../../feed/presentation/components/PostGrid';
import {flattenFeedPosts, useFeed} from '../../../feed/presentation/hooks/useFeed';
import {postDetailParamsFromPost} from '../../../feed/presentation/navigation/postDetailParams';
import {formatCompactCount, shortNpub} from '../../../../shared/format';
import {t} from '../../../../shared/i18n';
import {StillHaptics} from '../../../../shared/haptics/haptics';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {CachedImage} from '../../../../shared/ui/CachedImage';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {Icon} from '../../../../shared/ui/Icon';
import {Skeleton} from '../../../../shared/ui/Skeleton';
import {emptyProfile, type Profile} from '../../domain/Profile';
import {useProfile} from '../hooks/useProfile';

export type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<AppStackParamList>;
  route: {params?: {pubkeyHex?: string} | undefined};
};

type GridTab = 'posts' | 'extra';

function Avatar({
  picture,
  label,
  size,
}: {
  readonly picture: string;
  readonly label: string;
  readonly size: number;
}): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createAvatarStyles(theme, size), [theme, size]);

  if (picture.length > 0) {
    return (
      <View style={styles.ring}>
        <CachedImage
          uri={picture}
          accessibilityLabel={t('profile.avatarA11y', {label})}
          style={styles.avatarImage}
          containerStyle={styles.avatarContainer}
        />
      </View>
    );
  }

  return (
    <View
      accessibilityLabel={t('profile.avatarPlaceholderA11y')}
      style={[styles.ring, styles.avatarFallback]}>
      <Text style={styles.avatarInitial}>
        {(label.slice(0, 1) || '?').toUpperCase()}
      </Text>
    </View>
  );
}

function ProfileSkeleton(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createSkeletonStyles(theme), [theme]);
  return (
    <View style={styles.block} accessibilityLabel={t('profile.loadingA11y')}>
      <Skeleton width={96} height={96} radius={theme.radius.full} />
      <Skeleton width="55%" height={22} />
      <Skeleton width="40%" height={14} />
      <Skeleton width="80%" height={14} />
    </View>
  );
}

function ProfileHeader({
  profile,
  npub,
  isOwn,
  isFollowing,
  followPending,
  postCount,
  followingCount,
  onEdit,
  onToggleFollow,
  onShare,
  onMessage,
}: {
  readonly profile: Profile;
  readonly npub: string;
  readonly isOwn: boolean;
  readonly isFollowing: boolean;
  readonly followPending: boolean;
  readonly postCount: number;
  readonly followingCount: number;
  readonly onEdit: () => void;
  readonly onToggleFollow: () => void;
  readonly onShare: () => void;
  readonly onMessage: () => void;
}): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createHeaderStyles(theme), [theme]);
  const title =
    profile.displayName.length > 0
      ? profile.displayName
      : profile.name.length > 0
        ? profile.name
        : t('profile.unnamed');
  const handle = profile.name.length > 0 ? `@${profile.name}` : shortNpub(npub);

  return (
    <View style={styles.header}>
      <View style={styles.identityRow}>
        <Avatar picture={profile.picture} label={title} size={92} />
        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text accessibilityRole="header" numberOfLines={1} style={styles.displayName}>
              {title}
            </Text>
            <Icon name="check" size={18} color={theme.colors.accent.primary} />
          </View>
          <Text numberOfLines={1} style={styles.handle}>
            {isOwn ? handle : `${handle} · ${shortNpub(npub)}`}
          </Text>
          {profile.about.length > 0 ? (
            <Text style={styles.about}>{profile.about}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statCount}>{formatCompactCount(postCount)}</Text>
          <Text style={styles.statLabel}>{t('profile.postsStat')}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statCount}>—</Text>
          <Text style={styles.statLabel}>{t('profile.followersStat')}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statCount}>{formatCompactCount(followingCount)}</Text>
          <Text style={styles.statLabel}>{t('profile.followingStat')}</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        {isOwn ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profile.edit')}
            onPress={onEdit}
            style={({pressed}) => [
              styles.mainAction,
              pressed ? styles.pressed : null,
            ]}>
            <Text style={styles.mainActionLabel}>{t('profile.edit')}</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{busy: followPending, disabled: followPending}}
            disabled={followPending}
            onPress={onToggleFollow}
            style={({pressed}) => [
              styles.mainAction,
              pressed || followPending ? styles.pressed : null,
            ]}>
            {followPending ? (
              <ActivityIndicator color={theme.colors.text.primary} size="small" />
            ) : (
              <Text style={styles.mainActionLabel}>
                {isFollowing ? t('profile.following') : t('profile.follow')}
              </Text>
            )}
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isOwn ? t('profile.shareProfile') : t('profile.messageA11y')}
          onPress={isOwn ? onShare : onMessage}
          style={({pressed}) => [
            styles.iconAction,
            pressed ? styles.pressed : null,
          ]}>
          <Icon
            name={isOwn ? 'share' : 'send'}
            size={18}
            color={theme.colors.text.primary}
          />
        </Pressable>
      </View>
    </View>
  );
}

export function ProfileScreen({navigation, route}: ProfileScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createScreenStyles(theme, insets.top),
    [theme, insets.top],
  );
  const container = useAppContainer();
  const {identity} = useAuthSession();
  const routePubkey = route.params?.pubkeyHex;
  const pubkeyHex = (routePubkey ?? identity?.publicKey.toHex() ?? '').trim().toLowerCase();
  const isOwn = Boolean(identity && identity.publicKey.toHex() === pubkeyHex);
  const [gridTab, setGridTab] = useState<GridTab>('posts');

  const query = useProfile(pubkeyHex.length > 0 ? pubkeyHex : undefined);
  const followListQuery = useFollowList(pubkeyHex);
  const selfFollowList = useFollowList();
  const toggleFollow = useToggleFollow(pubkeyHex);
  const isFollowing = selfFollowList.data?.isFollowing(pubkeyHex) ?? false;
  const followingCount = followListQuery.data?.followedPubkeys().length ?? 0;

  useEffect(() => {
    if (toggleFollow.isError) {
      StillHaptics.error();
    }
  }, [toggleFollow.isError]);

  const authorFeed = useFeed({
    authors: pubkeyHex.length > 0 ? [pubkeyHex] : undefined,
    enabled: pubkeyHex.length > 0,
  });
  const posts = useMemo(() => {
    const all = flattenFeedPosts(authorFeed.data?.pages);
    if (pubkeyHex.length === 0) {
      return all;
    }
    return all.filter(post => post.authorPubkeyHex === pubkeyHex);
  }, [authorFeed.data?.pages, pubkeyHex]);

  const npub = useMemo(() => {
    if (pubkeyHex.length === 0) {
      return '';
    }
    const encoded = container.nip19.encodeNpub(pubkeyHex);
    return encoded.ok ? encoded.value : pubkeyHex;
  }, [container.nip19, pubkeyHex]);

  const cachedFallback =
    pubkeyHex.length > 0 ? container.getProfile.getCached(pubkeyHex) : null;
  const profile =
    query.data ?? cachedFallback ?? (pubkeyHex.length > 0 ? emptyProfile(pubkeyHex) : null);
  const showBack = navigation.canGoBack();
  const handleLabel =
    profile?.name && profile.name.length > 0
      ? `@${profile.name}`
      : t('profile.title');

  const onPressPost = useCallback(
    (post: ImagePost) => {
      navigation.navigate(
        'PostDetail',
        postDetailParamsFromPost(post, {authorFeed: true}),
      );
    },
    [navigation],
  );

  const onEndReached = useCallback(() => {
    if (authorFeed.hasNextPage && !authorFeed.isFetchingNextPage) {
      authorFeed.fetchNextPage().catch(() => undefined);
    }
  }, [authorFeed]);

  const onShareProfile = useCallback(async (): Promise<void> => {
    try {
      await Share.share({message: npub});
    } catch {
      Alert.alert(t('profile.shareFailed'));
    }
  }, [npub]);

  const listHeader = useMemo(() => {
    return (
      <View style={styles.listHeader}>
        {query.isLoading && !cachedFallback ? <ProfileSkeleton /> : null}

        {query.isError && !cachedFallback && !query.data ? (
          <View style={styles.padded}>
            <ErrorState
              title={t('profile.loadFailed')}
              message={
                query.error instanceof Error
                  ? query.error.message
                  : t('common.unknownError')
              }
              onRetry={() => {
                query.refetch().catch(() => undefined);
              }}
            />
          </View>
        ) : null}

        {profile ? (
          <ProfileHeader
            profile={profile}
            npub={npub}
            isOwn={isOwn}
            isFollowing={isFollowing}
            followPending={toggleFollow.isPending}
            postCount={posts.length}
            followingCount={followingCount}
            onEdit={() => navigation.navigate('EditProfile')}
            onToggleFollow={() => {
              StillHaptics.follow();
              toggleFollow.mutate(!isFollowing);
            }}
            onShare={() => {
              onShareProfile().catch(() => undefined);
            }}
            onMessage={() => navigation.navigate('Messages')}
          />
        ) : null}

        {toggleFollow.isError ? (
          <Text style={styles.followError}>{t('profile.followFailed')}</Text>
        ) : null}

        <View style={styles.gridTabs}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{selected: gridTab === 'posts'}}
            onPress={() => setGridTab('posts')}
            style={styles.gridTab}>
            <Icon
              name="grid"
              size={22}
              color={
                gridTab === 'posts'
                  ? theme.colors.accent.primary
                  : theme.colors.text.disabled
              }
            />
            {gridTab === 'posts' ? <View style={styles.gridTabLine} /> : null}
          </Pressable>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{selected: gridTab === 'extra'}}
            onPress={() => setGridTab('extra')}
            style={styles.gridTab}>
            <Icon
              name={isOwn ? 'bookmark' : 'image'}
              size={22}
              color={
                gridTab === 'extra'
                  ? theme.colors.accent.primary
                  : theme.colors.text.disabled
              }
            />
            {gridTab === 'extra' ? <View style={styles.gridTabLine} /> : null}
          </Pressable>
        </View>
      </View>
    );
  }, [
    cachedFallback,
    followingCount,
    gridTab,
    isFollowing,
    isOwn,
    navigation,
    npub,
    posts.length,
    profile,
    query,
    styles,
    theme.colors.accent.primary,
    theme.colors.text.disabled,
    toggleFollow,
    onShareProfile,
  ]);

  const extraEmpty = isOwn
    ? {
        title: t('profile.savedEmptyTitle'),
        message: t('profile.savedEmptyMessage'),
      }
    : {
        title: t('profile.taggedEmptyTitle'),
        message: t('profile.taggedEmptyMessage'),
      };

  return (
    <View style={styles.root}>
      <View style={styles.navRow}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={() => navigation.goBack()}
            hitSlop={theme.layout.hitSlop}
            style={({pressed}) => [styles.navSide, pressed ? styles.pressed : null]}>
            <Icon name="chevronLeft" size={24} color={theme.colors.text.primary} />
          </Pressable>
        ) : (
          <View style={styles.navSide} />
        )}
        <Text numberOfLines={1} style={styles.navTitle}>
          {handleLabel}
        </Text>
        {isOwn ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profile.moreA11y')}
            onPress={() => navigation.navigate('Account')}
            hitSlop={theme.layout.hitSlop}
            style={({pressed}) => [styles.navSide, pressed ? styles.pressed : null]}>
            <Icon name="ellipsis" size={22} color={theme.colors.text.primary} />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profile.shareProfile')}
            onPress={() => {
              onShareProfile().catch(() => undefined);
            }}
            hitSlop={theme.layout.hitSlop}
            style={({pressed}) => [styles.navSide, pressed ? styles.pressed : null]}>
            <Icon name="share" size={20} color={theme.colors.accent.primary} />
          </Pressable>
        )}
      </View>
      <PostGrid
        posts={gridTab === 'posts' ? posts : []}
        loading={gridTab === 'posts' && authorFeed.isPending && posts.length === 0}
        refreshing={authorFeed.isRefetching && !authorFeed.isFetchingNextPage}
        onRefresh={() => {
          authorFeed.refetch().catch(() => undefined);
          query.refetch().catch(() => undefined);
        }}
        onEndReached={gridTab === 'posts' ? onEndReached : undefined}
        fetchingMore={gridTab === 'posts' && authorFeed.isFetchingNextPage}
        error={
          gridTab === 'posts' && authorFeed.isError ? (authorFeed.error as Error) : null
        }
        onRetry={() => {
          authorFeed.refetch().catch(() => undefined);
        }}
        emptyTitle={
          gridTab === 'posts' ? t('profile.gridEmptyTitle') : extraEmpty.title
        }
        emptyMessage={
          gridTab === 'posts'
            ? isOwn
              ? t('profile.gridEmptySelf')
              : t('profile.gridEmptyOther')
            : extraEmpty.message
        }
        onPressPost={onPressPost}
        ListHeaderComponent={listHeader}
        contentPaddingBottom={insets.bottom + theme.spacing.md}
      />
    </View>
  );
}

function createSkeletonStyles(theme: Theme) {
  return StyleSheet.create({
    block: {
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.screenEdge,
      paddingBottom: theme.spacing.md,
    },
  });
}

function createAvatarStyles(theme: Theme, size: number) {
  return StyleSheet.create({
    ring: {
      width: size,
      height: size,
      borderRadius: theme.radius.full,
      borderWidth: 2,
      borderColor: theme.colors.accent.primary,
      padding: 3,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarContainer: {
      width: size - 10,
      height: size - 10,
      borderRadius: theme.radius.full,
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    } as FastImageStyle,
    avatarFallback: {
      backgroundColor: theme.colors.background.elevated,
    },
    avatarInitial: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.heading.fontSize,
      fontWeight: theme.typography.heading.fontWeight,
    },
  });
}

function createHeaderStyles(theme: Theme) {
  return StyleSheet.create({
    header: {
      paddingHorizontal: theme.spacing.screenEdge,
      gap: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    identityRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      alignItems: 'center',
    },
    identity: {
      flex: 1,
      gap: 4,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    displayName: {
      flexShrink: 1,
      color: theme.colors.text.primary,
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700',
    },
    handle: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
    },
    about: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
      lineHeight: 18,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    stat: {
      alignItems: 'center',
      minWidth: 72,
    },
    statCount: {
      color: theme.colors.text.primary,
      fontSize: 20,
      fontWeight: '700',
    },
    statLabel: {
      color: theme.colors.text.disabled,
      fontSize: theme.typography.caption.fontSize,
    },
    actionRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    mainAction: {
      flex: 1,
      minHeight: 42,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border.strong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mainActionLabel: {
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    iconAction: {
      width: 42,
      height: 42,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border.strong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      opacity: 0.7,
    },
  });
}

function createScreenStyles(theme: Theme, insetTop: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
      paddingTop: insetTop,
    },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.screenEdge,
      minHeight: 48,
    },
    navSide: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navTitle: {
      flex: 1,
      textAlign: 'center',
      color: theme.colors.text.primary,
      fontSize: theme.typography.heading.fontSize,
      fontWeight: '700',
    },
    listHeader: {
      paddingTop: theme.spacing.sm,
    },
    padded: {
      paddingHorizontal: theme.spacing.screenEdge,
    },
    followError: {
      paddingHorizontal: theme.spacing.screenEdge,
      color: theme.colors.state.error,
      fontSize: theme.typography.caption.fontSize,
    },
    gridTabs: {
      flexDirection: 'row',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.default,
      marginTop: theme.spacing.sm,
    },
    gridTab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
    },
    gridTabLine: {
      position: 'absolute',
      left: 24,
      right: 24,
      bottom: 0,
      height: 2,
      backgroundColor: theme.colors.accent.primary,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}

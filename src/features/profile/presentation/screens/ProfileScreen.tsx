import React, {useCallback, useEffect, useMemo} from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
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
import {t} from '../../../../shared/i18n';
import {StillHaptics} from '../../../../shared/haptics/haptics';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import {Button} from '../../../../shared/ui/Button';
import {EmptyState} from '../../../../shared/ui/EmptyState';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {HelpModal} from '../../../../shared/ui/HelpModal';
import {Icon} from '../../../../shared/ui/Icon';
import {Nip05Identifier} from '../../domain/Nip05Identifier';
import {isProfileContentEmpty, type Nip05Status, type Profile} from '../../domain/Profile';
import {useProfile} from '../hooks/useProfile';

/** Stack Profile and tab ProfileTab both render this screen. */
export type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<AppStackParamList>;
  route: {params?: {pubkeyHex?: string} | undefined};
};

function nip05BadgeLabel(status: Nip05Status): string {
  switch (status) {
    case 'verified':
      return t('profile.nip05Verified');
    case 'failed':
      return t('profile.nip05Failed');
    case 'unverified':
      return t('profile.nip05Unverified');
    default:
      return '';
  }
}

function nip05BadgeColor(
  status: Nip05Status,
  theme: ReturnType<typeof useTheme>,
): string {
  switch (status) {
    case 'verified':
      return theme.colors.state.success;
    case 'failed':
      return theme.colors.state.error;
    case 'unverified':
      return theme.colors.state.warning;
    default:
      return theme.colors.text.disabled;
  }
}

function ProfileSkeleton(): React.JSX.Element {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.screenEdge,
      }}
      accessibilityLabel={t('profile.loadingA11y')}>
      <View
        style={{
          width: 86,
          height: 86,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.background.elevated,
        }}
      />
      <View style={{flex: 1, gap: theme.spacing.sm, justifyContent: 'center'}}>
        <View
          style={{
            height: 18,
            width: '50%',
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.background.elevated,
          }}
        />
        <View
          style={{
            height: 14,
            width: '70%',
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.background.secondary,
          }}
        />
      </View>
    </View>
  );
}

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

  if (picture.length > 0) {
    return (
      <Image
        accessibilityLabel={t('profile.avatarA11y', {label})}
        source={{uri: picture}}
        style={{
          width: size,
          height: size,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.background.elevated,
        }}
      />
    );
  }

  return (
    <View
      accessibilityLabel={t('profile.avatarPlaceholderA11y')}
      style={{
        width: size,
        height: size,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.background.elevated,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border.default,
      }}>
      <Text
        style={{
          color: theme.colors.text.secondary,
          fontSize: theme.typography.heading.fontSize,
          fontWeight: theme.typography.heading.fontWeight,
        }}>
        {(label.slice(0, 1) || '?').toUpperCase()}
      </Text>
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
  onEdit,
  onToggleFollow,
}: {
  readonly profile: Profile;
  readonly npub: string;
  readonly isOwn: boolean;
  readonly isFollowing: boolean;
  readonly followPending: boolean;
  readonly postCount: number;
  readonly onEdit: () => void;
  readonly onToggleFollow: () => void;
}): React.JSX.Element {
  const theme = useTheme();
  const [showVerifiedHelp, setShowVerifiedHelp] = React.useState(false);
  const title =
    profile.displayName.length > 0
      ? profile.displayName
      : profile.name.length > 0
        ? profile.name
        : t('profile.unnamed');

  const nip05Label = useMemo(() => {
    if (profile.nip05 === null) {
      return null;
    }
    const parsed = Nip05Identifier.parse(profile.nip05);
    return parsed.ok ? parsed.value.displayLabel() : profile.nip05;
  }, [profile.nip05]);

  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.screenEdge,
        gap: theme.spacing.md,
        paddingBottom: theme.spacing.md,
      }}>
      <View style={{flexDirection: 'row', gap: theme.spacing.lg, alignItems: 'center'}}>
        <Avatar picture={profile.picture} label={title} size={86} />
        <View style={{flex: 1, gap: theme.spacing.xs}}>
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            style={{
              color: theme.colors.text.primary,
              fontSize: theme.typography.heading.fontSize,
              lineHeight: theme.typography.heading.lineHeight,
              fontWeight: theme.typography.heading.fontWeight,
            }}>
            {title}
          </Text>
          <View style={{flexDirection: 'row', gap: theme.spacing.lg}}>
            <View style={{alignItems: 'center'}}>
              <Text
                style={{
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.body.fontSize,
                  fontWeight: '700',
                }}>
                {postCount}
              </Text>
              <Text
                style={{
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.caption.fontSize,
                }}>
                {t('profile.postsStat')}
              </Text>
            </View>
          </View>
          {profile.name.length > 0 ? (
            <Text
              style={{
                color: theme.colors.text.secondary,
                fontSize: theme.typography.caption.fontSize,
              }}>
              @{profile.name}
            </Text>
          ) : null}
        </View>
      </View>

      {profile.about.length > 0 ? (
        <Text
          style={{
            color: theme.colors.text.primary,
            fontSize: theme.typography.body.fontSize,
            lineHeight: theme.typography.body.lineHeight,
          }}>
          {profile.about}
        </Text>
      ) : null}

      {nip05Label && profile.nip05Status !== 'none' ? (
        <View style={{gap: theme.spacing.xxs}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs}}>
            <Text
              style={{
                color: theme.colors.text.secondary,
                fontSize: theme.typography.caption.fontSize,
                fontWeight: '600',
                letterSpacing: 0.4,
                textTransform: 'uppercase',
              }}>
              {t('profile.verifiedUsername')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.helpA11y', {
                topic: t('profile.verifiedUsername'),
              })}
              onPress={() => setShowVerifiedHelp(true)}
              hitSlop={theme.layout.hitSlop}
              style={({pressed}) => ({opacity: pressed ? 0.7 : 1})}>
              <Icon name="help" size={16} color={theme.colors.text.secondary} />
            </Pressable>
          </View>
          <Text
            style={{
              color: nip05BadgeColor(profile.nip05Status, theme),
              fontSize: theme.typography.body.fontSize,
              fontWeight: '600',
            }}>
            {nip05Label}
            {' · '}
            {nip05BadgeLabel(profile.nip05Status)}
          </Text>
        </View>
      ) : null}

      <Text
        selectable
        numberOfLines={1}
        style={{
          color: theme.colors.text.disabled,
          fontSize: theme.typography.caption.fontSize,
        }}>
        {npub}
      </Text>

      {isOwn ? (
        <Button label={t('profile.edit')} variant="secondary" onPress={onEdit} />
      ) : (
        <Button
          label={isFollowing ? t('profile.unfollow') : t('profile.follow')}
          variant={isFollowing ? 'secondary' : 'primary'}
          loading={followPending}
          onPress={onToggleFollow}
        />
      )}

      <HelpModal
        visible={showVerifiedHelp}
        title={t('editProfile.nip05HelpTitle')}
        body={t('editProfile.nip05HelpBody')}
        onClose={() => setShowVerifiedHelp(false)}
      />
    </View>
  );
}

export function ProfileScreen({navigation, route}: ProfileScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const container = useAppContainer();
  const {identity} = useAuthSession();
  const routePubkey = route.params?.pubkeyHex;
  const pubkeyHex = (routePubkey ?? identity?.publicKey.toHex() ?? '').trim().toLowerCase();
  const isOwn = Boolean(identity && identity.publicKey.toHex() === pubkeyHex);

  const query = useProfile(pubkeyHex.length > 0 ? pubkeyHex : undefined);
  const followListQuery = useFollowList();
  const toggleFollow = useToggleFollow(pubkeyHex);
  const isFollowing = followListQuery.data?.isFollowing(pubkeyHex) ?? false;

  useEffect(() => {
    if (toggleFollow.isError) {
      StillHaptics.error();
    }
  }, [toggleFollow.isError]);

  const authorFeed = useFeed({
    authors: pubkeyHex.length > 0 ? [pubkeyHex] : undefined,
    enabled: pubkeyHex.length > 0,
  });
  const posts = useMemo(
    () => flattenFeedPosts(authorFeed.data?.pages),
    [authorFeed.data?.pages],
  );

  const npub = useMemo(() => {
    if (pubkeyHex.length === 0) {
      return '';
    }
    const encoded = container.nip19.encodeNpub(pubkeyHex);
    return encoded.ok ? encoded.value : pubkeyHex;
  }, [container.nip19, pubkeyHex]);

  const cachedFallback =
    pubkeyHex.length > 0 ? container.getProfile.getCached(pubkeyHex) : null;
  const profile = query.data ?? cachedFallback;
  const showBack = navigation.canGoBack();

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
    if (authorFeed.hasNextPage && !authorFeed.isFetchingNextPage) {
      void authorFeed.fetchNextPage();
    }
  }, [authorFeed]);

  const listHeader = useMemo(() => {
    return (
      <View style={{gap: theme.spacing.md, paddingBottom: theme.spacing.sm}}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: theme.spacing.screenEdge,
            paddingTop: theme.spacing.sm,
          }}>
          {showBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              onPress={() => navigation.goBack()}
              hitSlop={12}
              style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xxs}}>
              <Icon name="chevronLeft" size={22} color={theme.colors.accent.primary} />
              <Text
                style={{
                  color: theme.colors.accent.primary,
                  fontSize: theme.typography.body.fontSize,
                  fontWeight: '600',
                }}>
                {t('common.back')}
              </Text>
            </Pressable>
          ) : (
            <Text
              accessibilityRole="header"
              style={{
                color: theme.colors.text.primary,
                fontSize: theme.typography.title.fontSize,
                fontWeight: theme.typography.title.fontWeight,
              }}>
              {t('profile.title')}
            </Text>
          )}
          {isOwn ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('account.title')}
              onPress={() => navigation.navigate('Account')}
              hitSlop={12}>
              <Icon name="settings" size={24} color={theme.colors.text.primary} />
            </Pressable>
          ) : (
            <View style={{width: 24}} />
          )}
        </View>

        {query.isLoading && !profile ? <ProfileSkeleton /> : null}

        {query.isError && !profile ? (
          <View style={{paddingHorizontal: theme.spacing.screenEdge}}>
            <ErrorState
              title={t('profile.loadFailed')}
              message={
                query.error instanceof Error
                  ? query.error.message
                  : t('common.unknownError')
              }
              onRetry={() => {
                void query.refetch();
              }}
            />
          </View>
        ) : null}

        {profile && isProfileContentEmpty(profile) ? (
          <View
            style={{
              paddingHorizontal: theme.spacing.screenEdge,
              gap: theme.spacing.md,
            }}>
            <EmptyState
              title={t('profile.emptyTitle')}
              message={isOwn ? t('profile.emptySelf') : t('profile.emptyOther')}
              actionLabel={isOwn ? t('profile.create') : undefined}
              onAction={isOwn ? () => navigation.navigate('EditProfile') : undefined}
            />
            {!isOwn ? (
              <Button
                label={isFollowing ? t('profile.unfollow') : t('profile.follow')}
                variant={isFollowing ? 'secondary' : 'primary'}
                loading={toggleFollow.isPending}
                onPress={() => {
                  StillHaptics.follow();
                  toggleFollow.mutate(!isFollowing);
                }}
              />
            ) : null}
          </View>
        ) : null}

        {profile && !isProfileContentEmpty(profile) ? (
          <ProfileHeader
            profile={profile}
            npub={npub}
            isOwn={isOwn}
            isFollowing={isFollowing}
            followPending={toggleFollow.isPending}
            postCount={posts.length}
            onEdit={() => navigation.navigate('EditProfile')}
            onToggleFollow={() => {
              StillHaptics.follow();
              toggleFollow.mutate(!isFollowing);
            }}
          />
        ) : null}

        {toggleFollow.isError ? (
          <Text
            style={{
              paddingHorizontal: theme.spacing.screenEdge,
              color: theme.colors.state.error,
              fontSize: theme.typography.caption.fontSize,
            }}>
            {t('profile.followFailed')}
          </Text>
        ) : null}

        {query.isFetching && profile ? (
          <ActivityIndicator color={theme.colors.accent.primary} />
        ) : null}

        <Text
          style={{
            paddingHorizontal: theme.spacing.screenEdge,
            color: theme.colors.text.secondary,
            fontSize: theme.typography.caption.fontSize,
            fontWeight: '600',
            letterSpacing: 0.6,
            textTransform: 'uppercase',
          }}>
          {t('profile.gridTitle')}
        </Text>
      </View>
    );
  }, [
    theme,
    showBack,
    navigation,
    isOwn,
    query,
    profile,
    isFollowing,
    toggleFollow,
    npub,
    posts.length,
  ]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background.primary,
        paddingTop: insets.top,
      }}>
      <PostGrid
        posts={posts}
        loading={authorFeed.isPending && posts.length === 0}
        refreshing={authorFeed.isRefetching && !authorFeed.isFetchingNextPage}
        onRefresh={() => {
          void authorFeed.refetch();
          void query.refetch();
        }}
        onEndReached={onEndReached}
        fetchingMore={authorFeed.isFetchingNextPage}
        error={authorFeed.isError ? (authorFeed.error as Error) : null}
        onRetry={() => {
          void authorFeed.refetch();
        }}
        emptyTitle={t('profile.gridEmptyTitle')}
        emptyMessage={
          isOwn ? t('profile.gridEmptySelf') : t('profile.gridEmptyOther')
        }
        onPressPost={onPressPost}
        ListHeaderComponent={listHeader}
        contentPaddingBottom={insets.bottom + theme.spacing.md}
      />
    </View>
  );
}

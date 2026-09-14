import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {formatCompactCount, formatRelativeTime, formatRelativeTimeLong} from '../../../../shared/format';
import {t} from '../../../../shared/i18n';
import {StillHaptics} from '../../../../shared/haptics/haptics';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {CachedImage} from '../../../../shared/ui/CachedImage';
import {Icon} from '../../../../shared/ui/Icon';
import {useToast} from '../../../../shared/ui/Toast';
import type {ImageStyle as FastImageStyle} from '@d11/react-native-fast-image';
import {useProfile} from '../../../profile/presentation/hooks/useProfile';
import type {ImagePost} from '../../domain/ImagePost';
import type {ReactionSummary} from '../../../social/domain/Reaction';
import {emptyReactionSummary} from '../../../social/domain/Reaction';

export type FeedPostCardProps = {
  readonly post: ImagePost;
  readonly reaction?: ReactionSummary;
  readonly commentCount?: number;
  readonly onAuthorPress?: (pubkeyHex: string) => void;
  readonly onLikePress?: (post: ImagePost) => void;
  readonly onCommentPress?: (post: ImagePost) => void;
  readonly likePending?: boolean;
  /** Shared clock from the parent list (avoids one timer per card). */
  readonly nowSec?: number;
  readonly variant?: 'feed' | 'detail';
  readonly relayHost?: string;
  readonly onPostPress?: (post: ImagePost) => void;
};

const DOUBLE_TAP_MS = 280;
const AVATAR_SIZE = 40;

function AuthorAvatar({
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
      <CachedImage
        uri={picture}
        accessibilityLabel={t('profile.avatarA11y', {label})}
        style={styles.avatarImage}
        containerStyle={styles.avatarContainer}
      />
    );
  }
  return (
    <View
      accessibilityLabel={t('profile.avatarPlaceholderA11y')}
      style={styles.avatarFallback}>
      <Text style={styles.avatarInitial}>
        {(label.slice(0, 1) || '?').toUpperCase()}
      </Text>
    </View>
  );
}

function FeedPostCardInner({
  post,
  reaction,
  commentCount,
  onAuthorPress,
  onLikePress,
  onCommentPress,
  likePending = false,
  nowSec: nowSecProp,
  variant = 'feed',
  relayHost,
  onPostPress,
}: FeedPostCardProps): React.JSX.Element {
  const theme = useTheme();
  const toast = useToast();
  const styles = useMemo(() => createCardStyles(theme), [theme]);
  const [failed, setFailed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [localNowSec, setLocalNowSec] = useState(() => Math.floor(Date.now() / 1000));
  const lastTapRef = useRef(0);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDetail = variant === 'detail';
  const aspectRatio = useMemo(() => post.aspectRatio ?? 4 / 5, [post.aspectRatio]);
  const profile = useProfile(post.authorPubkeyHex);
  const summary = reaction ?? emptyReactionSummary(post.id);
  const liked = summary.likedByMe;
  const likeCount = summary.likeCount;
  const nowSec = nowSecProp ?? localNowSec;

  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);
  const likeCountScale = useSharedValue(1);
  const prevLikeCount = useRef(likeCount);

  useEffect(() => {
    if (nowSecProp !== undefined) {
      return;
    }
    const id = setInterval(() => setLocalNowSec(Math.floor(Date.now() / 1000)), 60_000);
    return () => clearInterval(id);
  }, [nowSecProp]);

  useEffect(() => {
    if (prevLikeCount.current === likeCount) {
      return;
    }
    prevLikeCount.current = likeCount;
    likeCountScale.value = withSequence(
      withSpring(1.18, {damping: 12}),
      withTiming(1, {duration: theme.motion.duration.micro}),
    );
  }, [likeCount, likeCountScale, theme.motion.duration.micro]);

  const displayName = useMemo(() => {
    const p = profile.data;
    if (p) {
      if (p.displayName.length > 0) {
        return p.displayName;
      }
      if (p.name.length > 0) {
        return p.name;
      }
    }
    return `${post.authorPubkeyHex.slice(0, 8)}...`;
  }, [profile.data, post.authorPubkeyHex]);

  const handle = useMemo(() => {
    const name = profile.data?.name.trim();
    if (name && name.length > 0) {
      return name.replace(/^@/, '');
    }
    return post.authorPubkeyHex.slice(0, 8);
  }, [profile.data, post.authorPubkeyHex]);

  const bodyText = useMemo(() => {
    if (post.caption.length > 0) {
      return post.caption;
    }
    if (post.title.length > 0 && post.title !== t('createPost.defaultTitle')) {
      return post.title;
    }
    return '';
  }, [post.caption, post.title]);

  const relativeTime = formatRelativeTime(post.createdAt, nowSec);
  const relativeTimeLong = formatRelativeTimeLong(post.createdAt, nowSec);

  useEffect(() => {
    return () => {
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
      }
    };
  }, []);

  const playHeartBurst = useCallback(() => {
    heartScale.value = 0.35;
    heartOpacity.value = 1;
    heartScale.value = withSequence(
      withSpring(1.15, {damping: 10}),
      withTiming(1, {duration: 120}),
      withDelay(180, withTiming(0.7, {duration: 220})),
    );
    heartOpacity.value = withSequence(
      withTiming(1, {duration: 60}),
      withDelay(320, withTiming(0, {duration: 240})),
    );
  }, [heartOpacity, heartScale]);

  const triggerLike = useCallback(() => {
    if (liked || likePending || !onLikePress) {
      return;
    }
    StillHaptics.like();
    onLikePress(post);
  }, [liked, likePending, onLikePress, post]);

  const onMediaPress = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
        singleTapTimer.current = null;
      }
      lastTapRef.current = 0;
      playHeartBurst();
      if (!liked) {
        triggerLike();
      } else {
        StillHaptics.like();
      }
      return;
    }
    lastTapRef.current = now;
    if (onPostPress && !isDetail) {
      singleTapTimer.current = setTimeout(() => {
        singleTapTimer.current = null;
        onPostPress(post);
      }, DOUBLE_TAP_MS);
    }
  }, [isDetail, liked, onPostPress, playHeartBurst, post, triggerLike]);

  const onShare = useCallback(async () => {
    try {
      StillHaptics.selection();
      await Share.share({
        message: post.media.url,
        url: post.media.url,
        title: post.title,
      });
    } catch {
      // User cancelled or share sheet unavailable.
    }
  }, [post.media.url, post.title]);

  const onToggleSave = useCallback(() => {
    StillHaptics.save();
    setSaved(prev => {
      const next = !prev;
      if (next) {
        toast.show(t('feed.saved'), {tone: 'success'});
      }
      return next;
    });
  }, [toast]);

  const onOpenMore = useCallback(() => {
    StillHaptics.selection();
    Alert.alert(displayName, undefined, [
      {
        text: t('feed.share'),
        onPress: () => {
          onShare().catch(() => undefined);
        },
      },
      {text: t('common.cancel'), style: 'cancel'},
    ]);
  }, [displayName, onShare]);

  const heartStyle = useAnimatedStyle(() => ({
    opacity: heartOpacity.value,
    transform: [{scale: heartScale.value}],
  }));

  const likeCountStyle = useAnimatedStyle(() => ({
    transform: [{scale: likeCountScale.value}],
  }));

  const compactLikes = formatCompactCount(likeCount);
  const compactComments =
    commentCount === undefined ? undefined : formatCompactCount(commentCount);

  return (
    <View style={isDetail ? styles.detailCard : styles.card}>
      <View style={[styles.header, isDetail ? styles.detailPad : null]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('feed.authorA11y', {short: displayName})}
          disabled={!onAuthorPress}
          onPress={() => onAuthorPress?.(post.authorPubkeyHex)}
          style={({pressed}) => [styles.authorHit, pressed ? styles.pressed : null]}>
          <AuthorAvatar
            picture={profile.data?.picture ?? ''}
            label={displayName}
            size={AVATAR_SIZE}
          />
          <View style={styles.headerText}>
            <View style={styles.nameRow}>
              <Text numberOfLines={1} style={styles.username}>
                {displayName}
              </Text>
              {isDetail ? (
                <Icon name="check" size={16} color={theme.colors.accent.primary} />
              ) : null}
            </View>
            <Text numberOfLines={1} style={styles.meta}>
              @{handle} · {relativeTime}
            </Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('feed.moreA11y')}
          hitSlop={theme.layout.hitSlop}
          onPress={onOpenMore}
          style={({pressed}) => [styles.moreHit, pressed ? styles.pressed : null]}>
          <Icon name="ellipsis" size={20} color={theme.colors.text.secondary} />
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel={t('feed.doubleTapLikeA11y')}
        onPress={onMediaPress}
        style={[
          styles.mediaWrap,
          {aspectRatio},
          isDetail ? styles.detailMedia : null,
        ]}>
        {failed ? (
          <View style={styles.mediaFallback}>
            <Text style={styles.mediaFallbackText}>{t('feed.imageUnavailable')}</Text>
          </View>
        ) : (
          <CachedImage
            uri={post.media.url}
            blurhash={post.media.blurhash}
            accessibilityLabel={post.media.alt ?? post.title}
            style={styles.mediaImage}
            containerStyle={styles.mediaImageContainer}
            resizeMode="cover"
            onError={() => setFailed(true)}
          />
        )}
        <Animated.View pointerEvents="none" style={[styles.heartBurst, heartStyle]}>
          <Icon name="heartFill" size={84} color={theme.colors.accent.primary} />
        </Animated.View>
      </Pressable>

      {!isDetail && bodyText.length > 0 ? (
        <Text style={styles.caption}>{bodyText}</Text>
      ) : null}

      <View style={[styles.actions, isDetail ? styles.detailPad : null]}>
        <View style={styles.actionsLeft}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              liked
                ? t('feed.liked')
                : t('feed.likeCountA11y', {count: compactLikes})
            }
            accessibilityState={{selected: liked, busy: likePending}}
            disabled={likePending || liked || !onLikePress}
            onPress={triggerLike}
            style={({pressed}) => [
              styles.actionHit,
              pressed ? styles.pressed : null,
            ]}>
            <Icon
              name={liked ? 'heartFill' : 'heart'}
              size={22}
              color={liked ? theme.colors.accent.primary : theme.colors.text.secondary}
            />
            {!isDetail ? (
              <Animated.Text
                style={[
                  styles.count,
                  liked ? styles.countActive : null,
                  likeCountStyle,
                ]}>
                {compactLikes}
              </Animated.Text>
            ) : null}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              compactComments !== undefined
                ? t('feed.commentCountA11y', {count: compactComments})
                : t('feed.comment')
            }
            disabled={!onCommentPress}
            onPress={() => {
              StillHaptics.selection();
              onCommentPress?.(post);
            }}
            style={({pressed}) => [
              styles.actionHit,
              pressed ? styles.pressed : null,
            ]}>
            <Icon name="comment" size={22} color={theme.colors.text.secondary} />
            {!isDetail && compactComments !== undefined ? (
              <Text style={styles.count}>{compactComments}</Text>
            ) : null}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('feed.share')}
            onPress={() => {
              onShare().catch(() => undefined);
            }}
            style={({pressed}) => [
              styles.actionHit,
              pressed ? styles.pressed : null,
            ]}>
            <Icon name="share" size={22} color={theme.colors.text.secondary} />
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? t('feed.saved') : t('feed.save')}
          accessibilityState={{selected: saved}}
          onPress={onToggleSave}
          style={({pressed}) => [
            styles.actionHit,
            pressed ? styles.pressed : null,
          ]}>
          <Icon
            name={saved ? 'bookmarkFill' : 'bookmark'}
            size={22}
            color={saved ? theme.colors.accent.primary : theme.colors.text.secondary}
          />
        </Pressable>
      </View>

      {isDetail ? (
        <View style={styles.detailPad}>
          {likeCount > 0 ? (
            <Text style={styles.likesLabel}>
              {t('feed.likesLabel', {count: compactLikes})}
            </Text>
          ) : null}
          {bodyText.length > 0 ? (
            <Text style={styles.detailCaption}>
              <Text style={styles.captionName}>{displayName} </Text>
              {bodyText}
            </Text>
          ) : null}
          <Text style={styles.detailStamp}>
            {relativeTimeLong}
            {relayHost ? ` · ${relayHost}` : ''}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export const FeedPostCard = React.memo(FeedPostCardInner);

function createAvatarStyles(theme: Theme, size: number) {
  return StyleSheet.create({
    avatarContainer: {
      width: size,
      height: size,
      borderRadius: theme.radius.full,
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    } as FastImageStyle,
    avatarFallback: {
      width: size,
      height: size,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.background.elevated,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border.default,
    },
    avatarInitial: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.username.fontSize,
      fontWeight: theme.typography.username.fontWeight,
    },
  });
}

function createCardStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      marginHorizontal: theme.spacing.screenEdge,
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
      gap: theme.spacing.sm,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.background.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.subtle,
      overflow: 'hidden',
      ...theme.elevation.card,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    authorHit: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      minWidth: 0,
    },
    headerText: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    username: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.username.fontSize,
      lineHeight: theme.typography.username.lineHeight,
      fontWeight: theme.typography.username.fontWeight,
      flexShrink: 1,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    meta: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.timestamp.fontSize,
      lineHeight: theme.typography.timestamp.lineHeight,
    },
    moreHit: {
      width: theme.layout.headerControlSize,
      height: theme.layout.headerControlSize,
      alignItems: 'center',
      justifyContent: 'center',
    },
    caption: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.body.fontSize,
      lineHeight: theme.typography.body.lineHeight,
    },
    mediaWrap: {
      width: '100%',
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.background.surface,
      overflow: 'hidden',
    },
    mediaImage: {
      width: '100%',
      height: '100%',
    } as FastImageStyle,
    mediaImageContainer: {
      ...StyleSheet.absoluteFill,
    },
    mediaFallback: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.md,
      minHeight: theme.layout.feedCardMediaMinHeight,
    },
    mediaFallbackText: {
      color: theme.colors.text.disabled,
      fontSize: theme.typography.caption.fontSize,
      textAlign: 'center',
    },
    heartBurst: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    actionsLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    actionHit: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xxs,
      minHeight: 36,
    },
    count: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
      fontWeight: '600',
      minWidth: 12,
    },
    countActive: {
      color: theme.colors.accent.primary,
    },
    detailCard: {
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.background.primary,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.default,
    },
    detailPad: {
      paddingHorizontal: theme.spacing.screenEdge,
    },
    detailMedia: {
      borderRadius: 0,
      width: '100%',
    },
    likesLabel: {
      color: theme.colors.text.primary,
      fontWeight: '700',
      fontSize: theme.typography.caption.fontSize,
      marginBottom: 4,
    },
    detailCaption: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.body.fontSize,
      lineHeight: theme.typography.body.lineHeight,
    },
    captionName: {
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    detailStamp: {
      color: theme.colors.text.disabled,
      fontSize: theme.typography.timestamp.fontSize,
      marginTop: 6,
    },
    pressed: {
      opacity: 0.72,
      transform: [{scale: 0.97}],
    },
  });
}

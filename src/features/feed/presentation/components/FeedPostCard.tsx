import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
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
import {t} from '../../../../shared/i18n';
import {StillHaptics} from '../../../../shared/haptics/haptics';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {CachedImage} from '../../../../shared/ui/CachedImage';
import {Icon} from '../../../../shared/ui/Icon';
import type {ImageStyle as FastImageStyle} from '@d11/react-native-fast-image';
import {useProfile} from '../../../profile/presentation/hooks/useProfile';
import type {ImagePost} from '../../domain/ImagePost';
import type {ReactionSummary} from '../../../social/domain/Reaction';
import {emptyReactionSummary} from '../../../social/domain/Reaction';

export type FeedPostCardProps = {
  readonly post: ImagePost;
  readonly reaction?: ReactionSummary;
  readonly onAuthorPress?: (pubkeyHex: string) => void;
  readonly onLikePress?: (post: ImagePost) => void;
  readonly onCommentPress?: (post: ImagePost) => void;
  readonly likePending?: boolean;
};

const DOUBLE_TAP_MS = 280;
const AVATAR_SIZE = 36;

function formatRelativeTime(createdAtSec: number, nowSec: number): string {
  const delta = Math.max(0, nowSec - createdAtSec);
  if (delta < 60) {
    return t('feed.timeSec', {count: delta});
  }
  if (delta < 3600) {
    return t('feed.timeMin', {count: Math.floor(delta / 60)});
  }
  if (delta < 86_400) {
    return t('feed.timeHour', {count: Math.floor(delta / 3600)});
  }
  if (delta < 86_400 * 7) {
    return t('feed.timeDay', {count: Math.floor(delta / 86_400)});
  }
  return t('feed.timeWeek', {count: Math.floor(delta / (86_400 * 7))});
}

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
  onAuthorPress,
  onLikePress,
  onCommentPress,
  likePending = false,
}: FeedPostCardProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createCardStyles(theme), [theme]);
  const [failed, setFailed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  const lastTapRef = useRef(0);
  const aspectRatio = useMemo(() => post.aspectRatio ?? 4 / 5, [post.aspectRatio]);
  const profile = useProfile(post.authorPubkeyHex);
  const summary = reaction ?? emptyReactionSummary(post.id);
  const liked = summary.likedByMe;
  const likeCount = summary.likeCount;

  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);
  const likeCountScale = useSharedValue(1);
  const prevLikeCount = useRef(likeCount);

  useEffect(() => {
    const id = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 30_000);
    return () => clearInterval(id);
  }, []);

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

  const relativeTime = formatRelativeTime(post.createdAt, nowSec);

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
  }, [liked, playHeartBurst, triggerLike]);

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
    setSaved(prev => !prev);
  }, []);

  const heartStyle = useAnimatedStyle(() => ({
    opacity: heartOpacity.value,
    transform: [{scale: heartScale.value}],
  }));

  const likeCountStyle = useAnimatedStyle(() => ({
    transform: [{scale: likeCountScale.value}],
  }));

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('feed.authorA11y', {short: displayName})}
        disabled={!onAuthorPress}
        onPress={() => onAuthorPress?.(post.authorPubkeyHex)}
        style={({pressed}) => [styles.header, pressed ? styles.pressed : null]}>
        <AuthorAvatar
          picture={profile.data?.picture ?? ''}
          label={displayName}
          size={AVATAR_SIZE}
        />
        <View style={styles.headerText}>
          <Text numberOfLines={1} style={styles.username}>
            {displayName}
          </Text>
          <Text numberOfLines={1} style={styles.timestamp}>
            {relativeTime}
          </Text>
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel={t('feed.doubleTapLikeA11y')}
        onPress={onMediaPress}
        style={[styles.mediaWrap, {aspectRatio}]}>
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
            resizeMode="cover"
            onError={() => setFailed(true)}
          />
        )}
        <Animated.View pointerEvents="none" style={[styles.heartBurst, heartStyle]}>
          <Icon name="heartFill" size={84} color={theme.colors.accent.primary} />
        </Animated.View>
      </Pressable>

      <View style={styles.body}>
        <View style={styles.actions}>
          <View style={styles.actionsLeft}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                liked
                  ? t('feed.liked')
                  : t('feed.likeCountA11y', {count: String(likeCount)})
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
                size={26}
                color={liked ? theme.colors.accent.primary : theme.colors.text.primary}
              />
              <Animated.Text
                style={[
                  styles.likeCount,
                  liked ? styles.likeCountActive : null,
                  likeCountStyle,
                ]}>
                {likeCount}
              </Animated.Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('feed.comment')}
              disabled={!onCommentPress}
              onPress={() => {
                StillHaptics.selection();
                onCommentPress?.(post);
              }}
              style={({pressed}) => [
                styles.actionHit,
                pressed ? styles.pressed : null,
              ]}>
              <Icon name="comment" size={26} color={theme.colors.text.primary} />
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
              <Icon name="share" size={24} color={theme.colors.text.primary} />
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
              size={24}
              color={saved ? theme.colors.accent.primary : theme.colors.text.primary}
            />
          </Pressable>
        </View>

        {post.title.length > 0 ? (
          <Text style={styles.caption}>
            <Text style={styles.captionAuthor}>{displayName} </Text>
            {post.title}
          </Text>
        ) : null}
        {post.caption.length > 0 && post.caption !== post.title ? (
          <Text style={styles.captionSecondary}>{post.caption}</Text>
        ) : null}
      </View>
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
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.background.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.subtle,
      overflow: 'hidden',
      ...theme.elevation.card,
      gap: 0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    headerText: {
      flex: 1,
      gap: 2,
    },
    username: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.username.fontSize,
      lineHeight: theme.typography.username.lineHeight,
      fontWeight: theme.typography.username.fontWeight,
    },
    timestamp: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.timestamp.fontSize,
      lineHeight: theme.typography.timestamp.lineHeight,
    },
    mediaWrap: {
      width: '100%',
      backgroundColor: theme.colors.background.surface,
      overflow: 'hidden',
    },
    mediaImage: {
      width: '100%',
      height: '100%',
    } as FastImageStyle,
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
    body: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
      gap: theme.spacing.xs,
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
    likeCount: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
      fontWeight: '600',
      minWidth: 12,
    },
    likeCountActive: {
      color: theme.colors.accent.primary,
    },
    caption: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.body.fontSize,
      lineHeight: theme.typography.body.lineHeight,
    },
    captionAuthor: {
      fontWeight: theme.typography.username.fontWeight,
    },
    captionSecondary: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.body.fontSize,
      lineHeight: theme.typography.body.lineHeight,
    },
    pressed: {
      opacity: 0.72,
      transform: [{scale: 0.97}],
    },
  });
}

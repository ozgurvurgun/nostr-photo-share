import React, {useCallback, useMemo, useRef, useState} from 'react';
import {Image, Pressable, Text, View} from 'react-native';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import {Icon} from '../../../../shared/ui/Icon';
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
          fontSize: theme.typography.caption.fontSize,
          fontWeight: '700',
        }}>
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
  const [failed, setFailed] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);
  const lastTapRef = useRef(0);
  const aspectRatio = useMemo(() => post.aspectRatio ?? 1, [post.aspectRatio]);
  const profile = useProfile(post.authorPubkeyHex);
  const summary = reaction ?? emptyReactionSummary(post.id);
  const liked = summary.likedByMe;

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

  const triggerLike = useCallback(() => {
    if (liked || likePending || !onLikePress) {
      return;
    }
    onLikePress(post);
  }, [liked, likePending, onLikePress, post]);

  const onMediaPress = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      lastTapRef.current = 0;
      if (!liked) {
        triggerLike();
      }
      setHeartBurst(true);
      setTimeout(() => setHeartBurst(false), 600);
      return;
    }
    lastTapRef.current = now;
  }, [liked, triggerLike]);

  return (
    <View style={{gap: theme.spacing.sm}}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('feed.authorA11y', {short: displayName})}
        disabled={!onAuthorPress}
        onPress={() => onAuthorPress?.(post.authorPubkeyHex)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
          paddingHorizontal: theme.spacing.screenEdge,
        }}>
        <AuthorAvatar
          picture={profile.data?.picture ?? ''}
          label={displayName}
          size={32}
        />
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            color: theme.colors.text.primary,
            fontSize: theme.typography.body.fontSize,
            lineHeight: theme.typography.body.lineHeight,
            fontWeight: '600',
          }}>
          {displayName}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel={t('feed.doubleTapLikeA11y')}
        onPress={onMediaPress}
        style={{
          width: '100%',
          aspectRatio,
          backgroundColor: theme.colors.background.elevated,
          overflow: 'hidden',
        }}>
        {failed ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              padding: theme.spacing.md,
            }}>
            <Text
              style={{
                color: theme.colors.text.disabled,
                fontSize: theme.typography.caption.fontSize,
                textAlign: 'center',
              }}>
              {t('feed.imageUnavailable')}
            </Text>
          </View>
        ) : (
          <Image
            accessibilityLabel={post.media.alt ?? post.title}
            source={{uri: post.media.url}}
            onError={() => setFailed(true)}
            style={{width: '100%', height: '100%'}}
            resizeMode="cover"
          />
        )}
        {heartBurst ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Icon name="heartFill" size={72} color={theme.colors.accent.primary} />
          </View>
        ) : null}
      </Pressable>

      <View
        style={{
          paddingHorizontal: theme.spacing.screenEdge,
          gap: theme.spacing.xs,
        }}>
        <View
          style={{
            flexDirection: 'row',
            gap: theme.spacing.lg,
            alignItems: 'center',
          }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={liked ? t('feed.liked') : t('feed.like')}
            accessibilityState={{selected: liked, busy: likePending}}
            disabled={likePending || liked || !onLikePress}
            onPress={triggerLike}
            style={({pressed}) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.xxs,
              opacity: pressed ? 0.7 : 1,
              transform: [{scale: pressed ? 0.94 : 1}],
            })}>
            <Icon
              name={liked ? 'heartFill' : 'heart'}
              size={26}
              color={liked ? theme.colors.accent.primary : theme.colors.text.primary}
            />
            <Text
              style={{
                color: liked ? theme.colors.accent.primary : theme.colors.text.secondary,
                fontSize: theme.typography.caption.fontSize,
                fontWeight: '600',
              }}>
              {summary.likeCount}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('feed.comment')}
            disabled={!onCommentPress}
            onPress={() => onCommentPress?.(post)}
            style={({pressed}) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.xxs,
              opacity: pressed ? 0.7 : 1,
              transform: [{scale: pressed ? 0.96 : 1}],
            })}>
            <Icon name="comment" size={26} color={theme.colors.text.primary} />
          </Pressable>
        </View>

        {post.title.length > 0 ? (
          <Text
            style={{
              color: theme.colors.text.primary,
              fontSize: theme.typography.body.fontSize,
              lineHeight: theme.typography.body.lineHeight,
              fontWeight: '600',
            }}>
            <Text style={{fontWeight: '700'}}>{displayName} </Text>
            {post.title}
          </Text>
        ) : null}
        {post.caption.length > 0 ? (
          <Text
            style={{
              color: theme.colors.text.secondary,
              fontSize: theme.typography.body.fontSize,
              lineHeight: theme.typography.body.lineHeight,
            }}>
            {post.caption}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export const FeedPostCard = React.memo(FeedPostCardInner);

import React, {useMemo} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, {Circle, Defs, LinearGradient, Stop} from 'react-native-svg';
import {t} from '../../../../shared/i18n';
import {triggerHaptic} from '../../../../shared/haptics/haptics';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {CachedImage} from '../../../../shared/ui/CachedImage';
import {Icon} from '../../../../shared/ui/Icon';
import type {ImageStyle as FastImageStyle} from '@d11/react-native-fast-image';
import {useProfile} from '../../../profile/presentation/hooks/useProfile';
import type {AuthorStoryStack} from '../../application/GetActiveStoriesUseCase';
import {authorStackHasUnseen} from '../hooks/useStories';
import {StoryRingSkeleton} from './StoryRingSkeleton';

export type StoryRingRowProps = {
  readonly stacks: readonly AuthorStoryStack[];
  readonly seenIds: ReadonlySet<string>;
  readonly selfPubkeyHex: string;
  readonly loading?: boolean;
  readonly onOpenAuthor: (authorPubkeyHex: string) => void;
  readonly onCreateStory: () => void;
};

export function StoryRingRow({
  stacks,
  seenIds,
  selfPubkeyHex,
  loading = false,
  onOpenAuthor,
  onCreateStory,
}: StoryRingRowProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createRowStyles(theme), [theme]);
  const avatarSize = theme.layout.storyAvatar;
  const ringWidth = theme.layout.storyRingWidth;
  const columnWidth = avatarSize + theme.layout.storyRingGap + ringWidth * 2;

  const selfStack = useMemo(
    () => stacks.find(stack => stack.authorPubkeyHex === selfPubkeyHex),
    [selfPubkeyHex, stacks],
  );
  const others = useMemo(
    () => stacks.filter(stack => stack.authorPubkeyHex !== selfPubkeyHex),
    [selfPubkeyHex, stacks],
  );

  if (loading && stacks.length === 0) {
    return <StoryRingSkeleton />;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      <SelfStoryChip
        selfPubkeyHex={selfPubkeyHex}
        stack={selfStack}
        unseen={selfStack ? authorStackHasUnseen(selfStack, seenIds) : true}
        onCreateStory={onCreateStory}
        onOpenAuthor={onOpenAuthor}
        avatarSize={avatarSize}
        ringWidth={ringWidth}
        columnWidth={columnWidth}
      />
      {others.map(stack => (
        <StoryRingAvatar
          key={stack.authorPubkeyHex}
          stack={stack}
          unseen={authorStackHasUnseen(stack, seenIds)}
          isSelf={false}
          onPress={() => onOpenAuthor(stack.authorPubkeyHex)}
          avatarSize={avatarSize}
          ringWidth={ringWidth}
          columnWidth={columnWidth}
        />
      ))}
    </ScrollView>
  );
}

function SelfStoryChip({
  selfPubkeyHex,
  stack,
  unseen,
  onCreateStory,
  onOpenAuthor,
  avatarSize,
  ringWidth,
  columnWidth,
}: {
  readonly selfPubkeyHex: string;
  readonly stack: AuthorStoryStack | undefined;
  readonly unseen: boolean;
  readonly onCreateStory: () => void;
  readonly onOpenAuthor: (authorPubkeyHex: string) => void;
  readonly avatarSize: number;
  readonly ringWidth: number;
  readonly columnWidth: number;
}): React.JSX.Element {
  const theme = useTheme();
  const profile = useProfile(selfPubkeyHex);
  const styles = useMemo(
    () => createChipStyles(theme, avatarSize, ringWidth, columnWidth),
    [theme, avatarSize, ringWidth, columnWidth],
  );
  const label =
    profile.data?.displayName?.trim() ||
    profile.data?.name?.trim() ||
    t('storyRing.you');
  const picture = profile.data?.picture?.trim() ?? '';
  const ringSize = avatarSize + ringWidth * 2 + 4;
  const hasStories = Boolean(stack && stack.stories.length > 0);

  const onAvatarPress = () => {
    triggerHaptic('selection');
    if (hasStories) {
      onOpenAuthor(selfPubkeyHex);
      return;
    }
    onCreateStory();
  };

  const onBadgePress = () => {
    triggerHaptic('selection');
    onCreateStory();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        hasStories
          ? t('storyRing.storiesA11y', {
              label,
              unseen: unseen ? t('storyRing.unseenSuffix') : t('storyRing.seenSuffix'),
            })
          : t('storyRing.createA11y')
      }
      onPress={onAvatarPress}
      style={({pressed}) => [styles.column, pressed ? styles.pressed : null]}>
      <View style={styles.ringWrap}>
        <StoryGradientRing
          size={ringSize}
          strokeWidth={ringWidth}
          unseen={unseen || !hasStories}
        />
        <View style={styles.avatarFrame}>
          {picture.length > 0 ? (
            <CachedImage
              uri={picture}
              style={styles.avatarImage}
              accessibilityLabel={label}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {label.slice(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('storyRing.createA11y')}
          hitSlop={theme.layout.hitSlop}
          onPress={onBadgePress}
          style={styles.createBadge}>
          <Icon name="plus" size={12} color={theme.colors.accent.onAccent} />
        </Pressable>
      </View>
      <Text numberOfLines={1} style={styles.label}>
        {t('storyRing.you')}
      </Text>
    </Pressable>
  );
}

function StoryRingAvatar({
  stack,
  unseen,
  isSelf,
  onPress,
  avatarSize,
  ringWidth,
  columnWidth,
}: {
  readonly stack: AuthorStoryStack;
  readonly unseen: boolean;
  readonly isSelf: boolean;
  readonly onPress: () => void;
  readonly avatarSize: number;
  readonly ringWidth: number;
  readonly columnWidth: number;
}): React.JSX.Element {
  const theme = useTheme();
  const profile = useProfile(stack.authorPubkeyHex);
  const styles = useMemo(
    () => createAvatarStyles(theme, avatarSize, ringWidth, columnWidth, unseen),
    [theme, avatarSize, ringWidth, columnWidth, unseen],
  );
  const label =
    profile.data?.displayName?.trim() ||
    profile.data?.name?.trim() ||
    (isSelf ? t('storyRing.you') : shortPubkey(stack.authorPubkeyHex));
  const picture = profile.data?.picture?.trim() ?? '';
  const ringSize = avatarSize + ringWidth * 2 + 4;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('storyRing.storiesA11y', {
        label,
        unseen: unseen ? t('storyRing.unseenSuffix') : t('storyRing.seenSuffix'),
      })}
      onPress={() => {
        triggerHaptic('selection');
        onPress();
      }}
      style={({pressed}) => [styles.column, pressed ? styles.pressed : null]}>
      <View style={styles.ringWrap}>
        <StoryGradientRing
          size={ringSize}
          strokeWidth={ringWidth}
          unseen={unseen}
        />
        <View style={styles.avatarFrame}>
          {picture.length > 0 ? (
            <CachedImage
              uri={picture}
              style={styles.avatarImage}
              accessibilityLabel={label}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {label.slice(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Text numberOfLines={1} style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

function StoryGradientRing({
  size,
  strokeWidth,
  unseen,
}: {
  readonly size: number;
  readonly strokeWidth: number;
  readonly unseen: boolean;
}): React.JSX.Element {
  const theme = useTheme();
  const radius = (size - strokeWidth) / 2;
  const gradientId = unseen ? 'stillStoryUnseen' : 'stillStorySeen';

  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      <Defs>
        {unseen ? (
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={theme.storyRingGradient.start} />
            <Stop offset="55%" stopColor={theme.storyRingGradient.mid} />
            <Stop offset="100%" stopColor={theme.storyRingGradient.end} />
          </LinearGradient>
        ) : (
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={theme.colors.border.strong} />
            <Stop offset="100%" stopColor={theme.colors.border.default} />
          </LinearGradient>
        )}
      </Defs>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        fill="none"
        opacity={unseen ? 1 : 0.55}
      />
    </Svg>
  );
}

function shortPubkey(pubkeyHex: string): string {
  if (pubkeyHex.length < 8) {
    return pubkeyHex;
  }
  return `${pubkeyHex.slice(0, 4)}...${pubkeyHex.slice(-4)}`;
}

function createRowStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.screenEdge,
      alignItems: 'flex-start',
    },
  });
}

function createChipStyles(
  theme: Theme,
  avatarSize: number,
  ringWidth: number,
  columnWidth: number,
) {
  const ringSize = avatarSize + ringWidth * 2 + 4;
  return StyleSheet.create({
    column: {
      alignItems: 'center',
      gap: theme.spacing.xxs,
      width: columnWidth,
    },
    pressed: {
      opacity: 0.75,
      transform: [{scale: 0.96}],
    },
    ringWrap: {
      width: ringSize,
      height: ringSize,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarFrame: {
      width: avatarSize,
      height: avatarSize,
      borderRadius: theme.radius.full,
      overflow: 'hidden',
      backgroundColor: theme.colors.background.elevated,
      borderWidth: 2,
      borderColor: theme.colors.background.primary,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    } as FastImageStyle,
    avatarFallback: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.username.fontSize,
      fontWeight: theme.typography.username.fontWeight,
    },
    createBadge: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 22,
      height: 22,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.accent.primary,
      borderWidth: 2,
      borderColor: theme.colors.background.primary,
    },
    label: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.caption.fontSize,
      lineHeight: theme.typography.caption.lineHeight,
      fontWeight: theme.typography.username.fontWeight,
      maxWidth: columnWidth,
      textAlign: 'center',
    },
  });
}

function createAvatarStyles(
  theme: Theme,
  avatarSize: number,
  ringWidth: number,
  columnWidth: number,
  unseen: boolean,
) {
  const ringSize = avatarSize + ringWidth * 2 + 4;
  return StyleSheet.create({
    column: {
      alignItems: 'center',
      gap: theme.spacing.xxs,
      width: columnWidth,
    },
    pressed: {
      opacity: 0.75,
      transform: [{scale: 0.96}],
    },
    ringWrap: {
      width: ringSize,
      height: ringSize,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarFrame: {
      width: avatarSize,
      height: avatarSize,
      borderRadius: theme.radius.full,
      overflow: 'hidden',
      backgroundColor: theme.colors.background.elevated,
      borderWidth: 2,
      borderColor: theme.colors.background.primary,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    } as FastImageStyle,
    avatarFallback: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.username.fontSize,
      fontWeight: theme.typography.username.fontWeight,
    },
    label: {
      color: unseen ? theme.colors.text.primary : theme.colors.text.secondary,
      fontSize: theme.typography.caption.fontSize,
      lineHeight: theme.typography.caption.lineHeight,
      fontWeight: unseen
        ? theme.typography.username.fontWeight
        : theme.typography.caption.fontWeight,
      maxWidth: columnWidth,
      textAlign: 'center',
    },
  });
}

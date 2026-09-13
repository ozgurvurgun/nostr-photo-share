import React, {useMemo} from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import {t} from '../../../../shared/i18n';
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
  const avatarSize = theme.layout.storyAvatar;
  const ringWidth = theme.layout.storyRingWidth;
  const columnWidth = avatarSize + theme.layout.storyRingGap;

  const ordered = useMemo(() => {
    const self = stacks.find(s => s.authorPubkeyHex === selfPubkeyHex);
    const others = stacks.filter(s => s.authorPubkeyHex !== selfPubkeyHex);
    return self ? [self, ...others] : [...others];
  }, [stacks, selfPubkeyHex]);

  if (loading && stacks.length === 0) {
    return <StoryRingSkeleton />;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        alignItems: 'flex-start',
      }}>
      <CreateStoryChip
        onPress={onCreateStory}
        avatarSize={avatarSize}
        ringWidth={ringWidth}
        columnWidth={columnWidth}
      />
      {ordered.map(stack => (
        <StoryRingAvatar
          key={stack.authorPubkeyHex}
          stack={stack}
          unseen={authorStackHasUnseen(stack, seenIds)}
          isSelf={stack.authorPubkeyHex === selfPubkeyHex}
          onPress={() => onOpenAuthor(stack.authorPubkeyHex)}
          avatarSize={avatarSize}
          ringWidth={ringWidth}
          columnWidth={columnWidth}
        />
      ))}
    </ScrollView>
  );
}

function CreateStoryChip({
  onPress,
  avatarSize,
  ringWidth,
  columnWidth,
}: {
  readonly onPress: () => void;
  readonly avatarSize: number;
  readonly ringWidth: number;
  readonly columnWidth: number;
}): React.JSX.Element {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('storyRing.createA11y')}
      onPress={onPress}
      style={{alignItems: 'center', gap: theme.spacing.xxs, width: columnWidth}}>
      <View
        style={{
          width: avatarSize + ringWidth * 2,
          height: avatarSize + ringWidth * 2,
          borderRadius: theme.radius.full,
          borderWidth: ringWidth,
          borderStyle: 'dashed',
          borderColor: theme.colors.border.default,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background.elevated,
        }}>
        <Text
          style={{
            color: theme.colors.accent.primary,
            fontSize: theme.typography.heading.fontSize,
            fontWeight: theme.typography.heading.fontWeight,
          }}>
          +
        </Text>
      </View>
      <Text
        numberOfLines={1}
        style={{
          color: theme.colors.text.secondary,
          fontSize: theme.typography.caption.fontSize,
          lineHeight: theme.typography.caption.lineHeight,
        }}>
        {t('storyRing.yourStory')}
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
  const label =
    profile.data?.displayName?.trim() ||
    profile.data?.name?.trim() ||
    (isSelf ? t('storyRing.you') : shortPubkey(stack.authorPubkeyHex));
  const picture = profile.data?.picture?.trim() ?? '';

  // Unseen: subtle two-stop accent ring (not Instagram rainbow). Seen: neutral.
  const outerRing = unseen ? theme.colors.accent.primary : theme.colors.border.default;
  const innerRing = unseen ? theme.colors.state.warning : theme.colors.background.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('storyRing.storiesA11y', {
        label,
        unseen: unseen ? t('storyRing.unseenSuffix') : '',
      })}
      onPress={onPress}
      style={{alignItems: 'center', gap: theme.spacing.xxs, width: columnWidth}}>
      <View
        style={{
          width: avatarSize + ringWidth * 2,
          height: avatarSize + ringWidth * 2,
          borderRadius: theme.radius.full,
          padding: 1,
          backgroundColor: outerRing,
        }}>
        <View
          style={{
            flex: 1,
            borderRadius: theme.radius.full,
            padding: Math.max(1, ringWidth - 1),
            backgroundColor: innerRing,
          }}>
          <View
            style={{
              flex: 1,
              borderRadius: theme.radius.full,
              overflow: 'hidden',
              backgroundColor: theme.colors.background.elevated,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {picture.length > 0 ? (
              <Image
                source={{uri: picture}}
                style={{width: '100%', height: '100%'}}
                accessibilityIgnoresInvertColors
              />
            ) : (
              <Text
                style={{
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.label.fontSize,
                  fontWeight: theme.typography.label.fontWeight,
                }}>
                {label.slice(0, 1).toUpperCase()}
              </Text>
            )}
          </View>
        </View>
      </View>
      <Text
        numberOfLines={1}
        style={{
          color: theme.colors.text.secondary,
          fontSize: theme.typography.caption.fontSize,
          lineHeight: theme.typography.caption.lineHeight,
          maxWidth: columnWidth,
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

function shortPubkey(pubkeyHex: string): string {
  if (pubkeyHex.length < 8) {
    return pubkeyHex;
  }
  return `${pubkeyHex.slice(0, 4)}...${pubkeyHex.slice(-4)}`;
}


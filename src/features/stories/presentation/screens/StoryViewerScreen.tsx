import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../../../../app/navigation/types';
import {t} from '../../../../shared/i18n';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import {Button} from '../../../../shared/ui/Button';
import {EmptyState} from '../../../../shared/ui/EmptyState';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import {isStoryExpired, type Story} from '../../domain/Story';
import {
  useActiveStories,
  useMarkStorySeen,
  useStorySeenIds,
} from '../hooks/useStories';

export type StoryViewerScreenProps = NativeStackScreenProps<
  AppStackParamList,
  'StoryViewer'
>;

export function StoryViewerScreen({
  navigation,
  route,
}: StoryViewerScreenProps): React.JSX.Element {
  const theme = useTheme();
  const storyDwellMs = theme.layout.storyDwellMs;
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const authorPubkeyHex = route.params.authorPubkeyHex.trim().toLowerCase();
  const initialStoryId = route.params.storyId?.trim().toLowerCase();

  // Author-scoped query so follow-ring authors are not missing from a global limit.
  const storiesQuery = useActiveStories({
    enabled: true,
    authors: [authorPubkeyHex],
  });
  const markSeen = useMarkStorySeen();
  const seenIds = useStorySeenIds();

  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 5_000);
    return () => clearInterval(id);
  }, []);

  const stories = useMemo(() => {
    const stacks = storiesQuery.data?.byAuthor ?? [];
    const stack = stacks.find(s => s.authorPubkeyHex === authorPubkeyHex);
    return (stack?.stories ?? []).filter(story => !isStoryExpired(story, nowSec));
  }, [storiesQuery.data?.byAuthor, authorPubkeyHex, nowSec]);

  const [index, setIndex] = useState(0);
  const seededForAuthor = useRef<string | null>(null);
  const indexRef = useRef(index);
  indexRef.current = index;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (stories.length === 0) {
      return;
    }
    const seedKey = `${authorPubkeyHex}:${initialStoryId ?? ''}`;
    if (seededForAuthor.current === seedKey) {
      // Clamp if expiration removed slides ahead of us.
      if (indexRef.current >= stories.length) {
        setIndex(Math.max(0, stories.length - 1));
      }
      return;
    }

    let start = 0;
    if (initialStoryId) {
      const idx = stories.findIndex(s => s.id === initialStoryId);
      if (idx >= 0) {
        start = idx;
      }
    } else {
      const firstUnseen = stories.findIndex(s => !seenIds.has(s.id));
      start = firstUnseen >= 0 ? firstUnseen : 0;
    }
    setIndex(start);
    setProgress(0);
    seededForAuthor.current = seedKey;
  }, [stories, authorPubkeyHex, initialStoryId, seenIds]);

  const current: Story | undefined = stories[index];

  const close = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const goNext = useCallback(() => {
    const next = indexRef.current + 1;
    if (next >= stories.length) {
      close();
      return;
    }
    setIndex(next);
    setProgress(0);
  }, [stories.length, close]);

  const goPrev = useCallback(() => {
    const prev = indexRef.current - 1;
    if (prev < 0) {
      setProgress(0);
      return;
    }
    setIndex(prev);
    setProgress(0);
  }, []);

  useEffect(() => {
    if (!current) {
      return;
    }
    markSeen.mutate(current.id);
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps -- mark once per story id

  useEffect(() => {
    if (!current) {
      return;
    }
    setProgress(0);
    const started = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - started;
      const ratio = Math.min(1, elapsed / storyDwellMs);
      setProgress(ratio);
      if (ratio >= 1) {
        clearInterval(tick);
        goNext();
      }
    }, 50);
    return () => clearInterval(tick);
  }, [current?.id, goNext, storyDwellMs]);

  if (storiesQuery.isPending && stories.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background.primary,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <ActivityIndicator color={theme.colors.accent.primary} />
      </View>
    );
  }

  if (storiesQuery.isError && stories.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background.primary,
          padding: theme.spacing.screenEdge,
          paddingTop: insets.top + theme.spacing.md,
        }}>
        <ErrorState
          title={t('storyViewer.loadFailed')}
          message={
            storiesQuery.error instanceof Error
              ? storiesQuery.error.message
              : t('common.unknownError')
          }
          onRetry={() => {
            void storiesQuery.refetch();
          }}
        />
        <Button label={t('common.close')} variant="ghost" onPress={close} />
      </View>
    );
  }

  if (!storiesQuery.isPending && stories.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background.primary,
          padding: theme.spacing.screenEdge,
          paddingTop: insets.top + theme.spacing.md,
          justifyContent: 'center',
        }}>
        <EmptyState
          title={t('storyViewer.emptyTitle')}
          message={t('storyViewer.emptyMessage')}
        />
        <Button label={t('common.close')} variant="ghost" onPress={close} />
      </View>
    );
  }

  if (!current) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background.primary,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <ActivityIndicator color={theme.colors.accent.primary} />
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: theme.colors.background.primary}}>
      <Image
        source={{uri: current.media.url}}
        style={{position: 'absolute', width: '100%', height: '100%'}}
        resizeMode="contain"
        accessibilityLabel={
          current.media.alt ?? (current.caption || t('storyViewer.imageFallback'))
        }
      />

      <View
        style={{
          position: 'absolute',
          top: insets.top + theme.spacing.xs,
          left: theme.spacing.sm,
          right: theme.spacing.sm,
          gap: theme.spacing.sm,
        }}>
        <View style={{flexDirection: 'row', gap: theme.spacing.xxs}}>
          {stories.map((story, i) => {
            const fill = i < index ? 1 : i === index ? progress : 0;
            return (
              <View
                key={story.id}
                style={{
                  flex: 1,
                  height: theme.layout.storyProgressHeight,
                  borderRadius: theme.radius.full,
                  backgroundColor: theme.colors.border.default,
                  overflow: 'hidden',
                }}>
                <View
                  style={{
                    width: `${fill * 100}%`,
                    height: '100%',
                    backgroundColor: theme.colors.accent.primary,
                  }}
                />
              </View>
            );
          })}
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('storyViewer.closeA11y')}
            onPress={close}
            hitSlop={theme.layout.hitSlop}
            style={{
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xxs,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.background.elevated,
            }}>
            <Text
              style={{
                color: theme.colors.text.primary,
                fontSize: theme.typography.body.fontSize,
                fontWeight: theme.typography.heading.fontWeight,
              }}>
              {t('common.close')}
            </Text>
          </Pressable>
        </View>
      </View>

      {current.caption.length > 0 ? (
        <View
          style={{
            position: 'absolute',
            left: theme.spacing.screenEdge,
            right: theme.spacing.screenEdge,
            bottom: insets.bottom + theme.spacing.lg,
            padding: theme.spacing.sm,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.background.elevated,
          }}>
          <Text
            style={{
              color: theme.colors.text.primary,
              fontSize: theme.typography.body.fontSize,
              lineHeight: theme.typography.body.lineHeight,
            }}>
            {current.caption}
          </Text>
        </View>
      ) : null}

      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: width * theme.layout.storyTapZoneFraction,
        }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('storyViewer.prevA11y')}
          onPress={goPrev}
          style={{flex: 1}}
        />
      </View>
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: width * theme.layout.storyTapZoneFraction,
        }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('storyViewer.nextA11y')}
          onPress={goNext}
          style={{flex: 1}}
        />
      </View>
    </View>
  );
}

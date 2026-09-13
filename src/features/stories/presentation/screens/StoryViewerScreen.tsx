import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../../../../app/navigation/types';
import {t} from '../../../../shared/i18n';
import {triggerHaptic} from '../../../../shared/haptics/haptics';
import {useTheme} from '../../../../shared/theme/ThemeProvider';
import type {Theme} from '../../../../shared/theme/types';
import {Button} from '../../../../shared/ui/Button';
import {CachedImage} from '../../../../shared/ui/CachedImage';
import {EmptyState} from '../../../../shared/ui/EmptyState';
import {ErrorState} from '../../../../shared/ui/ErrorState';
import type {ImageStyle as FastImageStyle} from '@d11/react-native-fast-image';
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
  const {width, height} = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, insets.top, insets.bottom), [
    theme,
    insets.top,
    insets.bottom,
  ]);

  const initialAuthor = route.params.authorPubkeyHex.trim().toLowerCase();
  const initialStoryId = route.params.storyId?.trim().toLowerCase();
  const authorQueue = useMemo(() => {
    const fromRoute = (route.params.authorQueue ?? [])
      .map(value => value.trim().toLowerCase())
      .filter(value => value.length === 64);
    if (fromRoute.length === 0) {
      return [initialAuthor];
    }
    if (!fromRoute.includes(initialAuthor)) {
      return [initialAuthor, ...fromRoute];
    }
    return fromRoute;
  }, [route.params.authorQueue, initialAuthor]);

  const [activeAuthor, setActiveAuthor] = useState(initialAuthor);
  useEffect(() => {
    setActiveAuthor(initialAuthor);
  }, [initialAuthor]);

  const storiesQuery = useActiveStories({
    enabled: true,
    authors: authorQueue,
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
    const stack = stacks.find(s => s.authorPubkeyHex === activeAuthor);
    return (stack?.stories ?? []).filter(story => !isStoryExpired(story, nowSec));
  }, [storiesQuery.data?.byAuthor, activeAuthor, nowSec]);

  const [index, setIndex] = useState(0);
  const seededForAuthor = useRef<string | null>(null);
  const indexRef = useRef(index);
  indexRef.current = index;
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (stories.length === 0) {
      return;
    }
    const seedKey = `${activeAuthor}:${initialStoryId ?? ''}`;
    if (seededForAuthor.current === seedKey) {
      if (indexRef.current >= stories.length) {
        setIndex(Math.max(0, stories.length - 1));
      }
      return;
    }

    let start = 0;
    if (activeAuthor === initialAuthor && initialStoryId) {
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
  }, [stories, activeAuthor, initialAuthor, initialStoryId, seenIds]);

  const current: Story | undefined = stories[index];
  const currentId = current?.id;

  const close = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const goNextAuthor = useCallback(() => {
    const at = authorQueue.indexOf(activeAuthor);
    if (at < 0 || at >= authorQueue.length - 1) {
      close();
      return;
    }
    const next = authorQueue[at + 1];
    if (!next) {
      close();
      return;
    }
    triggerHaptic('selection');
    seededForAuthor.current = null;
    setProgress(0);
    setIndex(0);
    setActiveAuthor(next);
  }, [authorQueue, activeAuthor, close]);

  const goPrevAuthor = useCallback(() => {
    const at = authorQueue.indexOf(activeAuthor);
    if (at <= 0) {
      setProgress(0);
      return;
    }
    const prev = authorQueue[at - 1];
    if (!prev) {
      return;
    }
    triggerHaptic('selection');
    seededForAuthor.current = null;
    setProgress(0);
    setIndex(0);
    setActiveAuthor(prev);
  }, [authorQueue, activeAuthor]);

  const goNext = useCallback(() => {
    const next = indexRef.current + 1;
    if (next >= stories.length) {
      goNextAuthor();
      return;
    }
    setIndex(next);
    setProgress(0);
  }, [stories.length, goNextAuthor]);

  const goPrev = useCallback(() => {
    const prev = indexRef.current - 1;
    if (prev < 0) {
      goPrevAuthor();
      return;
    }
    setIndex(prev);
    setProgress(0);
  }, [goPrevAuthor]);

  useEffect(() => {
    if (!currentId) {
      return;
    }
    markSeen.mutate(currentId);
  }, [currentId]); // eslint-disable-line react-hooks/exhaustive-deps -- mark once per story id

  useEffect(() => {
    if (!currentId || paused) {
      return;
    }
    let last = Date.now();
    const tick = setInterval(() => {
      const now = Date.now();
      const delta = now - last;
      last = now;
      setProgress(prev => {
        const next = Math.min(1, prev + delta / storyDwellMs);
        if (next >= 1) {
          clearInterval(tick);
          goNext();
        }
        return next;
      });
    }, 50);
    return () => clearInterval(tick);
  }, [currentId, goNext, storyDwellMs, paused]);

  const translateY = useSharedValue(0);
  const dismissThreshold = theme.layout.storyDismissThreshold;
  const authorSwipeThreshold = theme.layout.storyAuthorSwipeThreshold;

  const setPausedTrue = useCallback(() => setPaused(true), []);
  const setPausedFalse = useCallback(() => setPaused(false), []);

  const holdGesture = useMemo(
    () =>
      Gesture.LongPress()
        .minDuration(120)
        .maxDistance(24)
        .onStart(() => {
          runOnJS(setPausedTrue)();
        })
        .onFinalize(() => {
          runOnJS(setPausedFalse)();
        }),
    [setPausedTrue, setPausedFalse],
  );

  const dismissGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY(16)
        .failOffsetX([-24, 24])
        .onUpdate(event => {
          if (event.translationY > 0) {
            translateY.value = event.translationY;
          }
        })
        .onEnd(event => {
          if (event.translationY > dismissThreshold || event.velocityY > 900) {
            runOnJS(close)();
            return;
          }
          translateY.value = withTiming(0, {duration: theme.motion.duration.micro});
        }),
    [close, dismissThreshold, theme.motion.duration.micro, translateY],
  );

  const authorGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-16, 16])
        .failOffsetY([-24, 24])
        .onEnd(event => {
          if (event.translationX < -authorSwipeThreshold) {
            runOnJS(goNextAuthor)();
            return;
          }
          if (event.translationX > authorSwipeThreshold) {
            runOnJS(goPrevAuthor)();
          }
        }),
    [authorSwipeThreshold, goNextAuthor, goPrevAuthor],
  );

  const composedGesture = useMemo(
    () => Gesture.Simultaneous(holdGesture, Gesture.Exclusive(dismissGesture, authorGesture)),
    [holdGesture, dismissGesture, authorGesture],
  );

  const animatedRootStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
    opacity: 1 - Math.min(0.45, translateY.value / (height * 0.6)),
  }));

  if (storiesQuery.isPending && stories.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.accent.primary} />
      </View>
    );
  }

  if (storiesQuery.isError && stories.length === 0) {
    return (
      <View style={styles.stateScreen}>
        <ErrorState
          title={t('storyViewer.loadFailed')}
          message={
            storiesQuery.error instanceof Error
              ? storiesQuery.error.message
              : t('common.unknownError')
          }
          onRetry={() => {
            storiesQuery.refetch().catch(() => undefined);
          }}
        />
        <Button label={t('common.close')} variant="ghost" onPress={close} />
      </View>
    );
  }

  if (!storiesQuery.isPending && stories.length === 0) {
    return (
      <View style={[styles.stateScreen, styles.stateCentered]}>
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
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.accent.primary} />
      </View>
    );
  }

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[styles.root, animatedRootStyle]}
        accessibilityLabel={paused ? t('storyViewer.pauseA11y') : undefined}>
        <CachedImage
          uri={current.media.url}
          style={styles.media}
          resizeMode="contain"
          accessibilityLabel={
            current.media.alt ?? (current.caption || t('storyViewer.imageFallback'))
          }
        />

        <View style={styles.chrome}>
          <View style={styles.progressRow}>
            {stories.map((story, i) => {
              const fill = i < index ? 1 : i === index ? progress : 0;
              return (
                <View key={story.id} style={styles.progressTrack}>
                  <View style={[styles.progressFill, {width: `${fill * 100}%`}]} />
                </View>
              );
            })}
          </View>
          <View style={styles.topActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('storyViewer.closeA11y')}
              onPress={close}
              hitSlop={theme.layout.hitSlop}
              style={({pressed}) => [
                styles.closeChip,
                pressed ? styles.pressed : null,
              ]}>
              <Text style={styles.closeLabel}>{t('common.close')}</Text>
            </Pressable>
          </View>
        </View>

        {current.caption.length > 0 ? (
          <View style={styles.captionBox}>
            <Text style={styles.caption}>{current.caption}</Text>
          </View>
        ) : null}

        <View
          style={[
            styles.tapZone,
            styles.tapLeft,
            {width: width * theme.layout.storyTapZoneFraction},
          ]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('storyViewer.prevA11y')}
            onPress={goPrev}
            onPressIn={setPausedTrue}
            onPressOut={setPausedFalse}
            style={styles.tapHit}
          />
        </View>
        <View
          style={[
            styles.tapZone,
            styles.tapRight,
            {width: width * theme.layout.storyTapZoneFraction},
          ]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('storyViewer.nextA11y')}
            onPress={goNext}
            onPressIn={setPausedTrue}
            onPressOut={setPausedFalse}
            style={styles.tapHit}
          />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

function createStyles(theme: Theme, insetTop: number, insetBottom: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    centered: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stateScreen: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
      padding: theme.spacing.screenEdge,
      paddingTop: insetTop + theme.spacing.md,
      gap: theme.spacing.md,
    },
    stateCentered: {
      justifyContent: 'center',
    },
    media: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      width: '100%',
      height: '100%',
    } as FastImageStyle,
    chrome: {
      position: 'absolute',
      top: insetTop + theme.spacing.xs,
      left: theme.spacing.sm,
      right: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    progressRow: {
      flexDirection: 'row',
      gap: theme.spacing.xxs,
    },
    progressTrack: {
      flex: 1,
      height: theme.layout.storyProgressHeight,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.border.default,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.colors.accent.primary,
    },
    topActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    closeChip: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xxs,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.background.elevated,
    },
    closeLabel: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.body.fontSize,
      fontWeight: theme.typography.heading.fontWeight,
    },
    captionBox: {
      position: 'absolute',
      left: theme.spacing.screenEdge,
      right: theme.spacing.screenEdge,
      bottom: insetBottom + theme.spacing.lg,
      padding: theme.spacing.sm,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.overlay.scrim,
      borderWidth: 1,
      borderColor: theme.colors.overlay.glassStroke,
    },
    caption: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.body.fontSize,
      lineHeight: theme.typography.body.lineHeight,
    },
    tapZone: {
      position: 'absolute',
      top: 0,
      bottom: 0,
    },
    tapLeft: {
      left: 0,
    },
    tapRight: {
      right: 0,
    },
    tapHit: {
      flex: 1,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}

import React, {useEffect, useMemo} from 'react';
import {StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import FastImage, {
  type ImageStyle as FastImageStyle,
  type Priority,
  type ResizeMode,
} from '@d11/react-native-fast-image';
import {t} from '../i18n';
import {useTheme} from '../theme/ThemeProvider';

export type ZoomableImageProps = {
  readonly uri: string;
  readonly accessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
  readonly imageStyle?: StyleProp<FastImageStyle>;
  readonly resizeMode?: ResizeMode;
  readonly priority?: Priority;
  readonly maxScale?: number;
};

/**
 * Pinch / pan / double-tap zoom surface for full-screen media.
 * Pan only activates while zoomed so parent dismiss/swipe gestures keep working.
 */
export function ZoomableImage({
  uri,
  accessibilityLabel,
  style,
  imageStyle,
  resizeMode = 'contain',
  priority = FastImage.priority.normal,
  maxScale = 4,
}: ZoomableImageProps): React.JSX.Element {
  const theme = useTheme();
  const shortMs = theme.motion.duration.short;
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  useEffect(() => {
    scale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    startScale.value = 1;
    startX.value = 0;
    startY.value = 0;
  }, [uri, scale, translateX, translateY, startScale, startX, startY]);

  const pinch = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => {
          startScale.value = scale.value;
        })
        .onUpdate(event => {
          scale.value = Math.min(
            maxScale,
            Math.max(1, startScale.value * event.scale),
          );
        })
        .onEnd(() => {
          if (scale.value <= 1.05) {
            scale.value = withTiming(1, {duration: shortMs});
            translateX.value = withTiming(0, {duration: shortMs});
            translateY.value = withTiming(0, {duration: shortMs});
            startScale.value = 1;
            startX.value = 0;
            startY.value = 0;
          } else {
            startScale.value = scale.value;
          }
        }),
    // Shared values are stable refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maxScale, shortMs],
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .averageTouches(true)
        .manualActivation(true)
        .onTouchesMove((_event, state) => {
          if (scale.value > 1) {
            state.activate();
          } else {
            state.fail();
          }
        })
        .onStart(() => {
          startX.value = translateX.value;
          startY.value = translateY.value;
        })
        .onUpdate(event => {
          translateX.value = startX.value + event.translationX;
          translateY.value = startY.value + event.translationY;
        })
        .onEnd(() => {
          startX.value = translateX.value;
          startY.value = translateY.value;
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const doubleTap = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
          if (scale.value > 1.05) {
            scale.value = withTiming(1, {duration: shortMs});
            translateX.value = withTiming(0, {duration: shortMs});
            translateY.value = withTiming(0, {duration: shortMs});
            startScale.value = 1;
            startX.value = 0;
            startY.value = 0;
            return;
          }
          scale.value = withTiming(2, {duration: shortMs});
          startScale.value = 2;
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shortMs],
  );

  const composed = useMemo(
    () => Gesture.Simultaneous(pinch, pan, doubleTap),
    [pinch, pan, doubleTap],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: translateX.value},
      {translateY: translateY.value},
      {scale: scale.value},
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <View
        style={[styles.root, style]}
        accessibilityLabel={accessibilityLabel ?? t('mediaViewer.zoomA11y')}
        accessibilityRole="image">
        <Animated.View style={[styles.fill, animatedStyle]}>
          <FastImage
            source={{uri, priority, cache: FastImage.cacheControl.immutable}}
            style={[styles.image, imageStyle]}
            resizeMode={resizeMode}
          />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  } as FastImageStyle,
});

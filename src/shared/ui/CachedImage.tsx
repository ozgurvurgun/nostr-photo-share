import React, {useCallback, useMemo, useState} from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import FastImage, {
  type FastImageProps,
  type ImageStyle as FastImageStyle,
  type OnErrorEvent,
  type OnLoadEvent,
} from '@d11/react-native-fast-image';
import {Blurhash} from 'react-native-blurhash';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {useTheme} from '../theme/ThemeProvider';

export type CachedImageProps = Omit<FastImageProps, 'source' | 'style'> & {
  readonly uri: string;
  readonly blurhash?: string | null;
  readonly style?: StyleProp<FastImageStyle>;
  readonly containerStyle?: StyleProp<ViewStyle>;
  readonly accessibilityLabel?: string;
};

/**
 * Disk-cached remote image with optional blurhash placeholder and crossfade.
 * Presentation-only; domain still owns blurhash parsing (NIP-68 imeta).
 */
export function CachedImage({
  uri,
  blurhash,
  style,
  containerStyle,
  accessibilityLabel,
  onLoad,
  onError,
  ...rest
}: CachedImageProps): React.JSX.Element {
  const theme = useTheme();
  const opacity = useSharedValue(blurhash ? 0 : 1);
  const [showHash, setShowHash] = useState(Boolean(blurhash));

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const onImageLoad = useCallback(
    (event: OnLoadEvent) => {
      opacity.value = withTiming(1, {duration: theme.motion.duration.short});
      setShowHash(false);
      onLoad?.(event);
    },
    [onLoad, opacity, theme.motion.duration.short],
  );

  const onImageError = useCallback(
    (event: OnErrorEvent) => {
      opacity.value = 1;
      setShowHash(false);
      onError?.(event);
    },
    [onError, opacity],
  );

  const source = useMemo(
    () => ({
      uri,
      priority: FastImage.priority.normal,
      cache: FastImage.cacheControl.immutable,
    }),
    [uri],
  );

  const containerStyles = useMemo(
    () => [
      styles.container,
      {backgroundColor: theme.colors.background.surface} as const,
      containerStyle,
    ],
    [theme.colors.background.surface, containerStyle],
  );

  return (
    <View style={containerStyles}>
      {showHash && blurhash ? (
        <Blurhash
          blurhash={blurhash}
          style={StyleSheet.absoluteFill}
          decodeWidth={32}
          decodeHeight={32}
          decodeAsync
        />
      ) : null}
      {uri.length > 0 ? (
        <Animated.View style={[styles.fill, animatedStyle]}>
          <FastImage
            {...rest}
            accessibilityLabel={accessibilityLabel}
            source={source}
            style={[styles.fillImage, style]}
            onLoad={onImageLoad}
            onError={onImageError}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  fillImage: {
    width: '100%',
    height: '100%',
  } as FastImageStyle,
});

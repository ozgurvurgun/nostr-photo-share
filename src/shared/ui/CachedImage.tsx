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
import {useTheme} from '../theme/ThemeProvider';

export type CachedImageProps = Omit<FastImageProps, 'source' | 'style'> & {
  readonly uri: string;
  readonly blurhash?: string | null;
  readonly style?: StyleProp<FastImageStyle>;
  readonly containerStyle?: StyleProp<ViewStyle>;
  readonly accessibilityLabel?: string;
};

/**
 * Disk-cached remote image with optional blurhash placeholder.
 * Container fills its parent (width/height 100%) so feed media layouts size correctly.
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
  const [showHash, setShowHash] = useState(Boolean(blurhash));

  const onImageLoad = useCallback(
    (event: OnLoadEvent) => {
      setShowHash(false);
      onLoad?.(event);
    },
    [onLoad],
  );

  const onImageError = useCallback(
    (event: OnErrorEvent) => {
      setShowHash(false);
      onError?.(event);
    },
    [onError],
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
        <FastImage
          {...rest}
          accessibilityLabel={accessibilityLabel}
          source={source}
          style={[styles.fillImage, style]}
          onLoad={onImageLoad}
          onError={onImageError}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    width: '100%',
    height: '100%',
  },
  fillImage: {
    ...StyleSheet.absoluteFill,
  } as FastImageStyle,
});

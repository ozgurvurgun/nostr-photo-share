import React from 'react';
import {StyleSheet} from 'react-native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {useTheme} from '../../../../shared/theme/ThemeProvider';

/** Soft gold wash that fades into the screen background — no hard edge. */
export function AuthScreenGlow(): React.JSX.Element {
  const accent = useTheme().colors.accent.primary;

  return (
    <Svg pointerEvents="none" style={styles.glow}>
      <Defs>
        <LinearGradient id="stillAuthGlow" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={accent} stopOpacity={0.26} />
          <Stop offset="0.18" stopColor={accent} stopOpacity={0.16} />
          <Stop offset="0.42" stopColor={accent} stopOpacity={0.07} />
          <Stop offset="0.7" stopColor={accent} stopOpacity={0.02} />
          <Stop offset="1" stopColor={accent} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#stillAuthGlow)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
});

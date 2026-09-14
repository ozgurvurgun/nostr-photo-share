import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useKeyboardBottomInset} from '../keyboard';

export type KeyboardScreenProps = {
  readonly children: React.ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  /** Extra offset for headers / navigation bars (iOS KeyboardAvoidingView). */
  readonly keyboardVerticalOffset?: number;
};

/**
 * Root wrapper that keeps sticky footers and inputs above the keyboard.
 * iOS uses KeyboardAvoidingView; Android uses measured keyboard inset
 * (needed with edge-to-edge where adjustResize often does nothing).
 */
export function KeyboardScreen({
  children,
  style,
  keyboardVerticalOffset = 0,
}: KeyboardScreenProps): React.JSX.Element {
  const keyboardInset = useKeyboardBottomInset();
  const insets = useSafeAreaInsets();
  // Full overlap from screen bottom. Footers keep their own safe-area
  // padding, so subtract it once to avoid double-spacing above the IME.
  const androidPad =
    keyboardInset > 0 ? Math.max(0, keyboardInset - insets.bottom) : 0;

  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView
        style={[styles.flex, style]}
        behavior="padding"
        keyboardVerticalOffset={keyboardVerticalOffset}>
        {children}
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.flex, style, {paddingBottom: androidPad}]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});

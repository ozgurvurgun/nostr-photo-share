import {useEffect, useState} from 'react';
import {Dimensions, Keyboard, Platform, type KeyboardEvent} from 'react-native';

/**
 * Bottom inset matching how much of the screen the keyboard covers,
 * measured from the physical screen bottom to the keyboard top.
 * Prefer this over endCoordinates.height alone — on edge-to-edge Android
 * that value is often short by the nav-bar / IME toolbar.
 */
function keyboardOverlap(event: KeyboardEvent): number {
  const screenHeight = Dimensions.get('screen').height;
  const fromScreenBottom = screenHeight - event.endCoordinates.screenY;
  if (fromScreenBottom > 0) {
    return fromScreenBottom;
  }
  return Math.max(0, event.endCoordinates.height);
}

/**
 * Bottom inset matching the visible keyboard height.
 * Useful for Modals (Android often ignores adjustResize) and sticky footers.
 */
export function useKeyboardBottomInset(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const changeEvent =
      Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidChangeFrame';

    const onShow = Keyboard.addListener(showEvent, event => {
      setHeight(keyboardOverlap(event));
    });
    const onChange = Keyboard.addListener(changeEvent, event => {
      const next = keyboardOverlap(event);
      setHeight(next > 0 ? next : 0);
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setHeight(0);
    });

    return () => {
      onShow.remove();
      onChange.remove();
      onHide.remove();
    };
  }, []);

  return height;
}

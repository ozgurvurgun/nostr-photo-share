import {NativeModules} from 'react-native';

export function copyToClipboard(text: string): boolean {
  const clipboard = NativeModules.RNCClipboard ?? NativeModules.Clipboard;
  if (clipboard && typeof clipboard.setString === 'function') {
    clipboard.setString(text);
    return true;
  }
  return false;
}

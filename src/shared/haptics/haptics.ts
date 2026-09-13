import {Platform} from 'react-native';
import {trigger as nativeTrigger} from 'react-native-haptic-feedback';

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
} as const;

export type HapticKind =
  | 'selection'
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy'
  | 'success'
  | 'warning'
  | 'error';

const KIND_TO_TYPE: Record<HapticKind, string> = {
  selection: 'selection',
  impactLight: 'impactLight',
  impactMedium: 'impactMedium',
  impactHeavy: 'impactHeavy',
  success: 'notificationSuccess',
  warning: 'notificationWarning',
  error: 'notificationError',
};

/**
 * Shared haptic language for Still micro-interactions.
 * Safe no-op when the native module is unavailable (tests / web).
 */
export function triggerHaptic(kind: HapticKind): void {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return;
  }
  try {
    nativeTrigger(KIND_TO_TYPE[kind] as 'selection', options);
  } catch {
    // Native module missing in Jest / partial installs.
  }
}

/** Semantic aliases so call sites stay consistent across features. */
export const StillHaptics = {
  selection: () => triggerHaptic('selection'),
  tabChange: () => triggerHaptic('selection'),
  like: () => triggerHaptic('impactMedium'),
  follow: () => triggerHaptic('impactLight'),
  publishSuccess: () => triggerHaptic('success'),
  save: () => triggerHaptic('selection'),
  error: () => triggerHaptic('error'),
  warning: () => triggerHaptic('warning'),
} as const;

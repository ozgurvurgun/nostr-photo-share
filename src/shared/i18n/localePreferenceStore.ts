import * as Keychain from 'react-native-keychain';
import {NativeModules, Platform} from 'react-native';
import type {AppLocale} from './types';

const SERVICE = 'com.still.app.locale.preference';
const USERNAME = 'app.locale';

const KEYCHAIN_OPTIONS = {
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
} as const;

export function detectDeviceLocale(): AppLocale {
  const candidates: string[] = [];
  try {
    candidates.push(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    // ignore
  }
  if (Platform.OS === 'ios') {
    const settings = NativeModules.SettingsManager?.settings as
      | {AppleLocale?: string; AppleLanguages?: string[]}
      | undefined;
    if (settings?.AppleLocale) {
      candidates.push(settings.AppleLocale);
    }
    const first = settings?.AppleLanguages?.[0];
    if (typeof first === 'string') {
      candidates.push(first);
    }
  } else {
    const android = NativeModules.I18nManager?.localeIdentifier as
      | string
      | undefined;
    if (android) {
      candidates.push(android);
    }
  }

  for (const raw of candidates) {
    const lower = String(raw).toLowerCase().replace('_', '-');
    if (lower.startsWith('tr')) {
      return 'tr';
    }
  }
  return 'en';
}

export async function loadLocalePreference(): Promise<AppLocale | null> {
  try {
    const credentials = await Keychain.getGenericPassword({service: SERVICE});
    if (credentials === false) {
      return null;
    }
    const value = credentials.password.trim();
    if (value === 'tr' || value === 'en') {
      return value;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveLocalePreference(locale: AppLocale): Promise<void> {
  try {
    await Keychain.setGenericPassword(USERNAME, locale, {
      service: SERVICE,
      ...KEYCHAIN_OPTIONS,
    });
  } catch {
    // Best-effort; in-memory preference still applies for this session.
  }
}

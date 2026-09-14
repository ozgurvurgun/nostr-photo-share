import * as Keychain from 'react-native-keychain';

const SERVICE = 'com.still.app.theme.preference';
const USERNAME = 'theme.scheme';

const KEYCHAIN_OPTIONS = {
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
} as const;

export type ThemeScheme = 'light' | 'dark';

export async function loadThemePreference(): Promise<ThemeScheme | null> {
  try {
    const credentials = await Keychain.getGenericPassword({service: SERVICE});
    if (credentials === false) {
      return null;
    }
    const value = credentials.password.trim();
    if (value === 'light' || value === 'dark') {
      return value;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveThemePreference(scheme: ThemeScheme): Promise<void> {
  try {
    await Keychain.setGenericPassword(USERNAME, scheme, {
      service: SERVICE,
      ...KEYCHAIN_OPTIONS,
    });
  } catch {
    // Best-effort; in-memory preference still applies for this session.
  }
}

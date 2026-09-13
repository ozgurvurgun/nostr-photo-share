import type {LinkingOptions} from '@react-navigation/native';
import type {RootStackParamList} from './types';

export type DeepLinkRoute =
  | {readonly type: 'bunker'; readonly uri: string}
  | {readonly type: 'nostrconnect'; readonly uri: string}
  | {readonly type: 'nprofile'; readonly value: string}
  | {readonly type: 'nevent'; readonly value: string}
  | {readonly type: 'unknown'; readonly uri: string};

const STILL_PREFIXES = ['still://', 'nostr:', 'bunker://', 'nostrconnect://'];

/**
 * React Navigation linking config foundation for still://, nostr:, bunker://, nostrconnect://.
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: STILL_PREFIXES,
  config: {
    screens: {
      Auth: {
        screens: {
          Welcome: 'welcome',
          CreateIdentity: 'create',
          ImportNsec: 'import',
          ConnectBunker: {
            path: 'bunker',
            parse: {
              uri: (uri: string) => decodeURIComponent(uri),
            },
          },
        },
      },
      App: {
        screens: {
          MainTabs: {
            screens: {
              Home: 'home',
            },
          },
          Profile: 'profile',
          EditProfile: 'profile/edit',
        },
      },
    },
  },
};

export function parseDeepLink(url: string): DeepLinkRoute | null {
  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const lower = trimmed.toLowerCase();

  if (lower.startsWith('bunker://')) {
    return {type: 'bunker', uri: trimmed};
  }

  if (lower.startsWith('nostrconnect://')) {
    return {type: 'nostrconnect', uri: trimmed};
  }

  if (lower.startsWith('still://bunker') || lower.startsWith('nostr:bunker')) {
    const uriParam =
      extractQueryParam(trimmed, 'uri') ??
      trimmed.replace(/^[^:]+:\/?\/?bunker\/?/i, '');
    if (uriParam.toLowerCase().startsWith('bunker://')) {
      return {type: 'bunker', uri: uriParam};
    }
    return {type: 'bunker', uri: uriParam.length > 0 ? uriParam : trimmed};
  }

  const bech32 = stripScheme(trimmed);
  if (bech32.startsWith('nprofile1')) {
    return {type: 'nprofile', value: bech32};
  }
  if (bech32.startsWith('nevent1')) {
    return {type: 'nevent', value: bech32};
  }

  if (STILL_PREFIXES.some(prefix => lower.startsWith(prefix))) {
    return {type: 'unknown', uri: trimmed};
  }

  return null;
}

function stripScheme(url: string): string {
  if (url.toLowerCase().startsWith('nostr:')) {
    return url.slice('nostr:'.length);
  }
  if (url.toLowerCase().startsWith('still://')) {
    return url.slice('still://'.length);
  }
  return url;
}

function extractQueryParam(url: string, key: string): string | null {
  const queryIndex = url.indexOf('?');
  if (queryIndex < 0) {
    return null;
  }
  const params = new URLSearchParams(url.slice(queryIndex + 1));
  return params.get(key);
}

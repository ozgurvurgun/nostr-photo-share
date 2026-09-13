import * as Keychain from 'react-native-keychain';
import {err, ok, type Result} from '../../../core/result/Result';
import {IdentityStorageError} from '../domain/errors';
import type {
  IIdentitySessionStore,
  StoredSession,
} from '../application/ports/IIdentitySessionStore';

const BASE_SERVICE = 'com.still.app';
const SECRET_SERVICE = `${BASE_SERVICE}.identity.secretKey`;
const SESSION_SERVICE = `${BASE_SERVICE}.identity.session`;
const SECRET_USERNAME = 'identity.secretKey';
const SESSION_USERNAME = 'identity.session';

/** Session metadata is non-secret (pubkey + auth method); device-unlock is enough. */
const SESSION_KEYCHAIN_OPTIONS = {
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
} as const;

/**
 * Secret key requires biometry/passcode on Keychain read.
 * After a successful unlock, the hex is kept in memory for the app session so
 * likes/follows/posts do not re-prompt; wipe via clear() on logout.
 */
const SECRET_KEYCHAIN_OPTIONS = {
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
  authenticationPrompt: {
    title: 'Still',
    subtitle: 'Kimliğini doğrula',
    cancel: 'İptal',
  },
} as const;

export class KeychainIdentitySessionStore implements IIdentitySessionStore {
  /** App-session cache after the first successful biometric unlock. */
  private unlockedSecretHex: string | null = null;

  async saveSecretKeyHex(hex: string): Promise<Result<void, IdentityStorageError>> {
    try {
      const result = await Keychain.setGenericPassword(SECRET_USERNAME, hex, {
        service: SECRET_SERVICE,
        ...SECRET_KEYCHAIN_OPTIONS,
      });
      if (result === false) {
        return err(new IdentityStorageError('Failed to store secret key'));
      }
      this.unlockedSecretHex = hex;
      return ok(undefined);
    } catch (cause) {
      return err(new IdentityStorageError('Failed to store secret key', {cause}));
    }
  }

  async loadSecretKeyHex(): Promise<Result<string | null, IdentityStorageError>> {
    if (this.unlockedSecretHex !== null) {
      return ok(this.unlockedSecretHex);
    }

    try {
      const credentials = await Keychain.getGenericPassword({
        service: SECRET_SERVICE,
        authenticationPrompt: SECRET_KEYCHAIN_OPTIONS.authenticationPrompt,
      });
      if (credentials === false) {
        return ok(null);
      }
      this.unlockedSecretHex = credentials.password;
      return ok(credentials.password);
    } catch (cause) {
      return err(new IdentityStorageError('Failed to load secret key', {cause}));
    }
  }

  async saveSession(session: StoredSession): Promise<Result<void, IdentityStorageError>> {
    try {
      const result = await Keychain.setGenericPassword(
        SESSION_USERNAME,
        JSON.stringify(session),
        {
          service: SESSION_SERVICE,
          ...SESSION_KEYCHAIN_OPTIONS,
        },
      );
      if (result === false) {
        return err(new IdentityStorageError('Failed to store session metadata'));
      }
      return ok(undefined);
    } catch (cause) {
      return err(new IdentityStorageError('Failed to store session metadata', {cause}));
    }
  }

  async loadSession(): Promise<Result<StoredSession | null, IdentityStorageError>> {
    try {
      const credentials = await Keychain.getGenericPassword({service: SESSION_SERVICE});
      if (credentials === false) {
        return ok(null);
      }
      const parsed = JSON.parse(credentials.password) as StoredSession;
      return ok(parsed);
    } catch (cause) {
      return err(new IdentityStorageError('Failed to load session metadata', {cause}));
    }
  }

  async clear(): Promise<Result<void, IdentityStorageError>> {
    this.unlockedSecretHex = null;
    try {
      await Keychain.resetGenericPassword({service: SECRET_SERVICE});
      await Keychain.resetGenericPassword({service: SESSION_SERVICE});
      return ok(undefined);
    } catch (cause) {
      return err(new IdentityStorageError('Failed to clear identity storage', {cause}));
    }
  }
}

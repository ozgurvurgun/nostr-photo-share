import * as Keychain from 'react-native-keychain';
import {KeychainIdentitySessionStore} from './KeychainIdentitySessionStore';

describe('KeychainIdentitySessionStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores session metadata without biometric accessControl', async () => {
    const store = new KeychainIdentitySessionStore();
    const result = await store.saveSession({
      pubkeyHex: 'a'.repeat(64),
      authMethod: 'generated',
      bunkerPointer: null,
    });

    expect(result.ok).toBe(true);
    expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
      'identity.session',
      expect.any(String),
      expect.objectContaining({
        service: 'com.still.app.identity.session',
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      }),
    );
    const options = (Keychain.setGenericPassword as jest.Mock).mock.calls[0]?.[2] as Record<
      string,
      unknown
    >;
    expect(options.accessControl).toBeUndefined();
  });

  it('protects the secret with accessControl and caches after unlock', async () => {
    const store = new KeychainIdentitySessionStore();
    const secret = 'b'.repeat(64);

    const saved = await store.saveSecretKeyHex(secret);
    expect(saved.ok).toBe(true);
    expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
      'identity.secretKey',
      secret,
      expect.objectContaining({
        service: 'com.still.app.identity.secretKey',
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
        authenticationPrompt: expect.objectContaining({
          subtitle: 'Kimliğini doğrula',
          cancel: 'İptal',
        }),
      }),
    );

    (Keychain.getGenericPassword as jest.Mock).mockClear();

    const first = await store.loadSecretKeyHex();
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    expect(first.value).toBe(secret);
    // Saved path already warmed the in-memory cache; no Keychain read.
    expect(Keychain.getGenericPassword).not.toHaveBeenCalled();

    const second = await store.loadSecretKeyHex();
    expect(second.ok).toBe(true);
    expect(Keychain.getGenericPassword).not.toHaveBeenCalled();
  });

  it('reads secret from Keychain once when cache is cold, then reuses memory', async () => {
    const store = new KeychainIdentitySessionStore();
    const secret = 'c'.repeat(64);
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
      service: 'com.still.app.identity.secretKey',
      username: 'identity.secretKey',
      password: secret,
      storage: 'mock',
    });

    const first = await store.loadSecretKeyHex();
    expect(first.ok).toBe(true);
    expect(Keychain.getGenericPassword).toHaveBeenCalledTimes(1);
    expect(Keychain.getGenericPassword).toHaveBeenCalledWith(
      expect.objectContaining({
        service: 'com.still.app.identity.secretKey',
        authenticationPrompt: expect.objectContaining({
          subtitle: 'Kimliğini doğrula',
        }),
      }),
    );

    const second = await store.loadSecretKeyHex();
    expect(second.ok).toBe(true);
    if (!second.ok) {
      return;
    }
    expect(second.value).toBe(secret);
    expect(Keychain.getGenericPassword).toHaveBeenCalledTimes(1);
  });

  it('wipes the unlocked secret cache on clear', async () => {
    const store = new KeychainIdentitySessionStore();
    await store.saveSecretKeyHex('d'.repeat(64));
    (Keychain.getGenericPassword as jest.Mock).mockClear();

    const cleared = await store.clear();
    expect(cleared.ok).toBe(true);

    (Keychain.getGenericPassword as jest.Mock).mockResolvedValue(false);
    const loaded = await store.loadSecretKeyHex();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      return;
    }
    expect(loaded.value).toBeNull();
    expect(Keychain.getGenericPassword).toHaveBeenCalled();
  });
});

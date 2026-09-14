import {hexToBytes} from '../../../core/utilities/hex';
import {MemoryLogSink, Logger} from '../../../core/logging/Logger';
import {err, ok} from '../../../core/result/Result';
import {SignerUnavailableError} from '../../../core/errors/errors';
import type {ISigner} from './ports/ISigner';
import {AuthRuntime} from '../application/AuthRuntime';
import {ConnectBunkerUseCase} from '../application/ConnectBunkerUseCase';
import {CreateIdentityUseCase} from '../application/CreateIdentityUseCase';
import {GetCurrentUserUseCase} from '../application/GetCurrentUserUseCase';
import {ImportNsecUseCase} from '../application/ImportNsecUseCase';
import {LogoutUseCase} from '../application/LogoutUseCase';
import {RestoreSessionUseCase} from '../application/RestoreSessionUseCase';
import type {IBunkerConnector} from '../application/ports/IBunkerConnector';
import {BunkerConnectionError, SessionRestoreError} from '../domain/errors';
import {InMemoryIdentitySessionStore} from '../infrastructure/InMemoryIdentitySessionStore';
import {LocalSigner} from '../infrastructure/LocalSigner';
import {Nip19Codec} from '../infrastructure/Nip19Codec';
import {NostrToolsKeyGenerator} from '../infrastructure/NostrToolsKeyGenerator';

const NIP19_NSEC =
  'nsec1vl029mgpspedva04g90vltkh6fvh240zqtv9k0t9af8935ke9laqsnlfe5';
const NIP19_NSEC_HEX =
  '67dea2ed018072d675f5415ecfaed7d2597555e202d85b3d65ea4e58d2d92ffa';
const BUNKER_PUBKEY =
  '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d';

function fakeSigner(pubkey: string): ISigner {
  return {
    async getPublicKey() {
      return ok(pubkey);
    },
    async signEvent() {
      return err(new SignerUnavailableError('not used'));
    },
  };
}

function createHarness() {
  const store = new InMemoryIdentitySessionStore();
  const authRuntime = new AuthRuntime();
  const keyGenerator = new NostrToolsKeyGenerator();
  const nip19 = new Nip19Codec();
  const createLocalSigner = () => new LocalSigner(store);
  const bunkerConnector: IBunkerConnector = {
    async connect(uri: string) {
      if (!uri.startsWith('bunker://')) {
        return err(new BunkerConnectionError('Invalid bunker connection URI'));
      }
      return ok({
        remotePubkeyHex: BUNKER_PUBKEY,
        clientSecretKeyHex: 'aa'.repeat(32),
        bunkerPointer: {
          relays: ['wss://relay.example'],
          pubkey: BUNKER_PUBKEY,
          secret: 'secret',
        },
        signer: fakeSigner(BUNKER_PUBKEY),
        close: async () => undefined,
      });
    },
  };

  return {
    store,
    authRuntime,
    keyGenerator,
    nip19,
    createIdentity: new CreateIdentityUseCase(
      store,
      keyGenerator,
      authRuntime,
      createLocalSigner,
    ),
    importNsec: new ImportNsecUseCase(
      store,
      nip19,
      keyGenerator,
      authRuntime,
      createLocalSigner,
    ),
    connectBunker: new ConnectBunkerUseCase(store, bunkerConnector, authRuntime),
    getCurrentUser: new GetCurrentUserUseCase(authRuntime),
    logout: new LogoutUseCase(store, authRuntime),
    restore: new RestoreSessionUseCase({
      store,
      authRuntime,
      createLocalSigner,
      restoreBunkerSigner: async () => err(new SessionRestoreError('not used in local tests')),
    }),
  };
}

describe('CreateIdentityUseCase', () => {
  it('generates a local identity and stores the secret securely', async () => {
    const harness = createHarness();
    const result = await harness.createIdentity.execute();

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.authMethod).toBe('generated');
    expect(result.value.publicKey.toHex()).toHaveLength(64);
    expect(harness.authRuntime.getIdentity()?.publicKey.toHex()).toBe(
      result.value.publicKey.toHex(),
    );
    expect(harness.authRuntime.getSigner()).not.toBeNull();

    const secret = await harness.store.loadSecretKeyHex();
    expect(secret.ok && secret.value !== null && secret.value.length === 64).toBe(true);
  });

  it('persists a caller-supplied secret instead of generating a new one', async () => {
    const harness = createHarness();
    const secret = hexToBytes(NIP19_NSEC_HEX);
    const result = await harness.createIdentity.execute(secret);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.authMethod).toBe('generated');
    expect(result.value.publicKey.toHex()).toBe(
      harness.keyGenerator.getPublicKeyHex(hexToBytes(NIP19_NSEC_HEX)),
    );
    const stored = await harness.store.loadSecretKeyHex();
    expect(stored.ok && stored.value).toBe(NIP19_NSEC_HEX);
  });
});

describe('ImportNsecUseCase', () => {
  it('imports a known nsec and derives the expected pubkey', async () => {
    const harness = createHarness();
    const result = await harness.importNsec.execute(NIP19_NSEC);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.authMethod).toBe('imported');
    expect(result.value.publicKey.toHex()).toBe(
      harness.keyGenerator.getPublicKeyHex(hexToBytes(NIP19_NSEC_HEX)),
    );

    const secret = await harness.store.loadSecretKeyHex();
    expect(secret.ok && secret.value).toBe(NIP19_NSEC_HEX);
  });

  it('rejects invalid nsec without exposing the input in the error', async () => {
    const harness = createHarness();
    const bad = 'nsec1thisisnotavalidsecretkeyxxxxxxxxxxxxxxxxxxxxxxx';
    const result = await harness.importNsec.execute(bad);

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.message).toBe('Invalid nsec');
    expect(result.error.message).not.toContain(bad);
    expect(JSON.stringify(result.error)).not.toContain(bad);
  });

  it('never logs the nsec when import fails', async () => {
    const harness = createHarness();
    const sink = new MemoryLogSink();
    const logger = new Logger(sink);
    const badNsec = NIP19_NSEC;

    const result = await harness.importNsec.execute('npub1invalid');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      logger.error('import failed', {error: result.error, attempted: badNsec});
    }

    const serialized = JSON.stringify(sink.records);
    expect(serialized).not.toContain(badNsec);
    expect(serialized).toContain('[REDACTED]');
  });
});

describe('LogoutUseCase', () => {
  it('clears keychain material and discards the runtime session', async () => {
    const harness = createHarness();
    await harness.createIdentity.execute();
    expect(harness.authRuntime.getIdentity()).not.toBeNull();

    const logout = await harness.logout.execute();
    expect(logout.ok).toBe(true);
    expect(harness.authRuntime.getIdentity()).toBeNull();
    expect(harness.authRuntime.getSigner()).toBeNull();

    const secret = await harness.store.loadSecretKeyHex();
    const session = await harness.store.loadSession();
    expect(secret.ok && secret.value).toBeNull();
    expect(session.ok && session.value).toBeNull();
  });
});

describe('RestoreSessionUseCase', () => {
  it('restores a previously saved local session', async () => {
    const harness = createHarness();
    const created = await harness.createIdentity.execute();
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const pubkey = created.value.publicKey.toHex();
    await harness.authRuntime.clear();
    expect(harness.authRuntime.getIdentity()).toBeNull();

    const restored = await harness.restore.execute();
    expect(restored.ok).toBe(true);
    if (!restored.ok) {
      return;
    }
    expect(restored.value?.publicKey.toHex()).toBe(pubkey);
    expect(harness.authRuntime.getSigner()).not.toBeNull();
  });

  it('returns null when no session is stored', async () => {
    const harness = createHarness();
    const restored = await harness.restore.execute();
    expect(restored.ok).toBe(true);
    if (!restored.ok) {
      return;
    }
    expect(restored.value).toBeNull();
  });
});

describe('ConnectBunkerUseCase', () => {
  it('stores bunker session metadata and activates a remote signer', async () => {
    const harness = createHarness();
    const result = await harness.connectBunker.execute('bunker://example');

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.authMethod).toBe('bunker');
    expect(result.value.publicKey.toHex()).toBe(BUNKER_PUBKEY);
    expect(harness.authRuntime.getSigner()).not.toBeNull();

    const session = await harness.store.loadSession();
    expect(session.ok && session.value?.bunkerPointer?.relays).toEqual([
      'wss://relay.example',
    ]);
  });

  it('rejects invalid bunker URIs', async () => {
    const harness = createHarness();
    const result = await harness.connectBunker.execute('not-a-bunker');
    expect(result.ok).toBe(false);
  });
});

describe('GetCurrentUserUseCase', () => {
  it('returns the active identity after create', async () => {
    const harness = createHarness();
    const empty = harness.getCurrentUser.execute();
    expect(empty.ok && empty.value).toBeNull();

    const created = await harness.createIdentity.execute();
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const current = harness.getCurrentUser.execute();
    expect(current.ok && current.value?.publicKey.toHex()).toBe(
      created.value.publicKey.toHex(),
    );
  });
});

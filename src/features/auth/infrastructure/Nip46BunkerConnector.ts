import {SimplePool} from 'nostr-tools/pool';
import {
  BunkerSigner,
  parseBunkerInput,
  type BunkerPointer,
} from 'nostr-tools/nip46';
import {bytesToHex, hexToBytes, wipeBytes} from '../../../core/utilities/hex';
import {err, ok, type Result} from '../../../core/result/Result';
import {nostrToolsCryptoAdapter} from '../../../infrastructure/nostr/crypto/nostrToolsCryptoAdapter';
import type {
  BunkerConnectOptions,
  BunkerConnectResult,
  IBunkerConnector,
} from '../application/ports/IBunkerConnector';
import type {StoredBunkerPointer} from '../application/ports/IIdentitySessionStore';
import {BunkerConnectionError, SessionRestoreError} from '../domain/errors';
import {Nip46SignerAdapter} from './Nip46SignerAdapter';

/**
 * Shared SimplePool for all NIP-46 bunker sessions in this process.
 * RelayPool is not an AbstractSimplePool, so bunkers keep a dedicated pool —
 * sharing one instance avoids opening duplicate sockets per connect/restore.
 */
let sharedNip46Pool: SimplePool | null = null;

function getSharedNip46Pool(): SimplePool {
  if (sharedNip46Pool === null) {
    sharedNip46Pool = new SimplePool();
  }
  return sharedNip46Pool;
}

function toStoredPointer(pointer: BunkerPointer): StoredBunkerPointer {
  return {
    relays: pointer.relays,
    pubkey: pointer.pubkey,
    secret: pointer.secret,
  };
}

function toBunkerPointer(pointer: StoredBunkerPointer): BunkerPointer {
  return {
    relays: [...pointer.relays],
    pubkey: pointer.pubkey,
    secret: pointer.secret,
  };
}

export class Nip46BunkerConnector implements IBunkerConnector {
  async connect(
    uri: string,
    options?: BunkerConnectOptions,
  ): Promise<Result<BunkerConnectResult, BunkerConnectionError>> {
    try {
      const pointer = await parseBunkerInput(uri);
      if (pointer === null) {
        return err(new BunkerConnectionError('Invalid bunker connection URI'));
      }

      const clientSecretKey = nostrToolsCryptoAdapter.generateSecretKey();
      try {
        const pool = getSharedNip46Pool();
        const bunker = BunkerSigner.fromBunker(clientSecretKey, pointer, {
          pool,
          onauth: options?.onAuthUrl,
        });

        await bunker.connect();
        const remotePubkeyHex = await bunker.getPublicKey();
        const adapter = new Nip46SignerAdapter(bunker);

        return ok({
          remotePubkeyHex,
          clientSecretKeyHex: bytesToHex(clientSecretKey),
          bunkerPointer: toStoredPointer(bunker.bp),
          signer: adapter,
          close: async () => {
            try {
              await bunker.logout();
            } catch {
              await bunker.close();
            } finally {
              // Close only this bunker's relays; keep the shared pool for future sessions.
              pool.close(pointer.relays);
            }
          },
        });
      } finally {
        wipeBytes(clientSecretKey);
      }
    } catch (cause) {
      return err(new BunkerConnectionError('Failed to connect to bunker', {cause}));
    }
  }
}

export async function restoreNip46Signer(input: {
  readonly clientSecretKeyHex: string;
  readonly bunkerPointer: StoredBunkerPointer;
}): Promise<
  Result<{readonly signer: Nip46SignerAdapter; readonly close: () => Promise<void>}, SessionRestoreError>
> {
  const clientSk = hexToBytes(input.clientSecretKeyHex);
  try {
    const pool = getSharedNip46Pool();
    const pointer = toBunkerPointer(input.bunkerPointer);
    const bunker = BunkerSigner.fromBunker(clientSk, pointer, {
      pool,
    });
    await bunker.connect();
    const adapter = new Nip46SignerAdapter(bunker);
    return ok({
      signer: adapter,
      close: async () => {
        try {
          await bunker.logout();
        } catch {
          await bunker.close();
        } finally {
          pool.close(pointer.relays);
        }
      },
    });
  } catch (cause) {
    return err(new SessionRestoreError('Failed to restore bunker session', {cause}));
  } finally {
    wipeBytes(clientSk);
  }
}

import {useEffect, useRef} from 'react';
import {useAppContainer} from '../../../../app/providers/AppContainerContext';

/**
 * Discovers followed authors' NIP-65 write relays and merges them into the pool as outbox.
 * Deferred so tab navigation stays responsive on first paint.
 */
export function useOutboxDiscovery(authorPubkeyHexes: readonly string[] | undefined): void {
  const container = useAppContainer();
  const authorsKey =
    authorPubkeyHexes !== undefined && authorPubkeyHexes.length > 0
      ? [...authorPubkeyHexes].map(a => a.trim().toLowerCase()).sort().join(',')
      : '';
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (authorsKey.length === 0) {
      if (lastKey.current !== '') {
        lastKey.current = '';
        void container.discoverOutboxRelays.execute([]);
      }
      return;
    }
    if (lastKey.current === authorsKey) {
      return;
    }
    lastKey.current = authorsKey;
    const authors = authorsKey.split(',');
    const timer = setTimeout(() => {
      void container.discoverOutboxRelays.execute(authors).then(result => {
        if (!result.ok) {
          container.logger.warn('Outbox relay discovery failed', {
            code: result.error.code,
          });
        }
      });
    }, 0);
    return () => {
      clearTimeout(timer);
    };
  }, [authorsKey, container]);
}

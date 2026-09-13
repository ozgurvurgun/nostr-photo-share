import {useEffect, useState} from 'react';
import {useAppContainer} from '../../../../app/providers/AppContainerContext';

/** Polls relay pool connectivity for the offline banner (no NetInfo dependency). */
export function useRelayOnline(
  pollMs = 2_000,
  options: {readonly enabled?: boolean} = {},
): boolean {
  const container = useAppContainer();
  const enabled = options.enabled ?? true;
  const [online, setOnline] = useState(
    () => container.relayPool.getConnectedRelayCount() > 0,
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const tick = (): void => {
      setOnline(container.relayPool.getConnectedRelayCount() > 0);
    };
    tick();
    const id = setInterval(tick, pollMs);
    return () => clearInterval(id);
  }, [container.relayPool, pollMs, enabled]);

  return online;
}

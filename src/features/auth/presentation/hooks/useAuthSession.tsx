import React, {useCallback, useContext, useEffect, useMemo, useState, createContext} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import type {AppContainer} from '../../../../app/di/container';
import {feedQueryKeyRoot} from '../../../feed/presentation/feedQueryKeys';
import {profileQueryKeyRoot} from '../../../profile/presentation/profileQueryKeys';
import {socialQueryKeyRoot} from '../../../social/presentation/socialQueryKeys';
import {storyQueryKeyRoot} from '../../../stories/presentation/storyQueryKeys';
import {relayQueryKeyRoot} from '../../../relays/presentation/relayQueryKeys';
import type {NostrIdentity} from '../../domain/NostrIdentity';
import type {AuthSessionSnapshot} from '../authSessionTypes';

export type AuthSessionContextValue = AuthSessionSnapshot & {
  readonly refresh: () => void;
  readonly retryRestore: () => Promise<void>;
  readonly clearSession: () => Promise<void>;
  readonly setIdentity: (identity: NostrIdentity | null) => void;
  /** Sets identity and hydrates NIP-65 relay list into the pool. */
  readonly completeLogin: (identity: NostrIdentity) => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export type AuthSessionProviderProps = {
  readonly container: AppContainer;
  readonly children: React.ReactNode;
};

function clearSessionQueries(queryClient: ReturnType<typeof useQueryClient>): void {
  queryClient.removeQueries({queryKey: feedQueryKeyRoot});
  queryClient.removeQueries({queryKey: profileQueryKeyRoot});
  queryClient.removeQueries({queryKey: socialQueryKeyRoot});
  queryClient.removeQueries({queryKey: storyQueryKeyRoot});
  queryClient.removeQueries({queryKey: relayQueryKeyRoot});
}

export function AuthSessionProvider({
  container,
  children,
}: AuthSessionProviderProps): React.JSX.Element {
  const queryClient = useQueryClient();
  const [identity, setIdentity] = useState<NostrIdentity | null>(
    container.authRuntime.getIdentity(),
  );
  const [isRestoring, setIsRestoring] = useState(!container.sessionRestored);
  const [restoreError, setRestoreError] = useState<string | null>(
    container.lastRestoreError,
  );

  const runRestore = useCallback(async (): Promise<void> => {
    setIsRestoring(true);
    setRestoreError(null);
    const result = await container.restoreSession.execute();
    container.markSessionRestored();
    if (!result.ok) {
      container.lastRestoreError = result.error.message;
      setRestoreError(result.error.message);
      setIdentity(null);
    } else {
      container.lastRestoreError = null;
      setRestoreError(null);
      setIdentity(result.value);
      if (result.value) {
        await container.hydrateRelayListFromSession();
      }
    }
    setIsRestoring(false);
  }, [container]);

  const clearSession = useCallback(async (): Promise<void> => {
    await container.logout.execute();
    clearSessionQueries(queryClient);
    container.lastRestoreError = null;
    setRestoreError(null);
    setIdentity(null);
    setIsRestoring(false);
  }, [container, queryClient]);

  useEffect(() => {
    if (container.sessionRestored) {
      setIdentity(container.authRuntime.getIdentity());
      setRestoreError(container.lastRestoreError);
      setIsRestoring(false);
      return;
    }
    void runRestore();
  }, [container, runRestore]);

  const refresh = useCallback(() => {
    setIdentity(container.authRuntime.getIdentity());
  }, [container]);

  const completeLogin = useCallback(
    async (next: NostrIdentity): Promise<void> => {
      setIdentity(next);
      try {
        await container.hydrateRelayListFromSession();
      } catch (error) {
        container.logger.warn('Relay list hydrate after login failed', {error});
      }
    },
    [container],
  );

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      identity,
      isRestoring,
      restoreError,
      refresh,
      retryRestore: runRestore,
      clearSession,
      setIdentity,
      completeLogin,
    }),
    [identity, isRestoring, restoreError, refresh, runRestore, clearSession, completeLogin],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession(): AuthSessionContextValue {
  const value = useContext(AuthSessionContext);
  if (value === null) {
    throw new Error('useAuthSession must be used within AuthSessionProvider');
  }
  return value;
}

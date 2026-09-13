import React, {createContext, useContext} from 'react';
import type {AppContainer} from '../di/container';

const AppContainerContext = createContext<AppContainer | null>(null);

export type AppContainerProviderProps = {
  readonly container: AppContainer;
  readonly children: React.ReactNode;
};

export function AppContainerProvider({
  container,
  children,
}: AppContainerProviderProps): React.JSX.Element {
  return (
    <AppContainerContext.Provider value={container}>{children}</AppContainerContext.Provider>
  );
}

export function useAppContainer(): AppContainer {
  const container = useContext(AppContainerContext);
  if (container === null) {
    throw new Error('useAppContainer must be used within AppContainerProvider');
  }
  return container;
}

import React from 'react';
import {StyleSheet} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {AuthSessionProvider} from '../../features/auth/presentation/hooks/useAuthSession';
import {ThemeProvider} from '../../shared/theme/ThemeProvider';
import type {AppContainer} from '../di/container';
import {AppContainerProvider} from './AppContainerContext';

const initialSafeAreaMetrics = {
  frame: {x: 0, y: 0, width: 390, height: 844},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export type AppProvidersProps = {
  readonly children: React.ReactNode;
  readonly scheme?: 'light' | 'dark';
  readonly container?: AppContainer;
  readonly queryClient?: QueryClient;
};

export function AppProviders({
  children,
  scheme,
  container,
  queryClient = defaultQueryClient,
}: AppProvidersProps): React.JSX.Element {
  const content = container ? (
    <AppContainerProvider container={container}>
      <AuthSessionProvider container={container}>{children}</AuthSessionProvider>
    </AppContainerProvider>
  ) : (
    children
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider initialMetrics={initialSafeAreaMetrics}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider scheme={scheme}>{content}</ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

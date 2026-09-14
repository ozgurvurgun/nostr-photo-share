import React, {useEffect, useState} from 'react';
import {ActivityIndicator, StatusBar, StyleSheet, View} from 'react-native';
import {bootstrapAsync} from './src/app/bootstrap/bootstrap';
import type {AppContainer} from './src/app/di/container';
import {RootNavigator} from './src/app/navigation/RootNavigator';
import {AppProviders} from './src/app/providers/AppProviders';
import {useTheme} from './src/shared/theme/ThemeProvider';

function BootstrapLoading(): React.JSX.Element {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.centered,
        {backgroundColor: theme.colors.background.primary},
      ]}>
      <ActivityIndicator color={theme.colors.accent.primary} />
    </View>
  );
}

function ThemedStatusBar(): React.JSX.Element {
  const theme = useTheme();
  return (
    <StatusBar
      barStyle={theme.scheme === 'light' ? 'dark-content' : 'light-content'}
    />
  );
}

function App(): React.JSX.Element {
  const [container, setContainer] = useState<AppContainer | null>(null);

  useEffect(() => {
    let cancelled = false;
    bootstrapAsync().then(ready => {
      if (!cancelled) {
        setContainer(ready);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (container === null) {
    return (
      <AppProviders>
        <ThemedStatusBar />
        <BootstrapLoading />
      </AppProviders>
    );
  }

  return (
    <AppProviders container={container}>
      <ThemedStatusBar />
      <RootNavigator />
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;

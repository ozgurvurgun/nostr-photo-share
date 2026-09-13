import React, {createContext, useContext, useMemo} from 'react';
import {useColorScheme} from 'react-native';
import {darkTheme, lightTheme} from './themes';
import type {Theme} from './types';

const ThemeContext = createContext<Theme | null>(null);

export type ThemeProviderProps = {
  readonly children: React.ReactNode;
  readonly scheme?: 'light' | 'dark';
};

export function ThemeProvider({children, scheme}: ThemeProviderProps): React.JSX.Element {
  const systemScheme = useColorScheme();
  const theme = useMemo(() => {
    const resolved = scheme ?? (systemScheme === 'light' ? 'light' : 'dark');
    return resolved === 'light' ? lightTheme : darkTheme;
  }, [scheme, systemScheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (theme === null) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return theme;
}

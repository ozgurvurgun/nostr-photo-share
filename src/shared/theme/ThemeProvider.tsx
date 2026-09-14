import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {darkTheme, lightTheme} from './themes';
import {
  loadThemePreference,
  saveThemePreference,
  type ThemeScheme,
} from './themePreferenceStore';
import type {Theme} from './types';

const ThemeContext = createContext<Theme | null>(null);

type ThemePreferenceValue = {
  readonly scheme: ThemeScheme;
  readonly setScheme: (scheme: ThemeScheme) => void;
};

const ThemePreferenceContext = createContext<ThemePreferenceValue | null>(null);

export type ThemeProviderProps = {
  readonly children: React.ReactNode;
  /** Forces a scheme (tests). When set, preference toggle still updates UI. */
  readonly scheme?: ThemeScheme;
};

export function ThemeProvider({
  children,
  scheme: schemeOverride,
}: ThemeProviderProps): React.JSX.Element {
  const [preference, setPreference] = useState<ThemeScheme>(
    schemeOverride ?? 'light',
  );

  useEffect(() => {
    if (schemeOverride !== undefined) {
      return;
    }
    let cancelled = false;
    loadThemePreference().then(saved => {
      if (!cancelled && saved !== null) {
        setPreference(saved);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [schemeOverride]);

  useEffect(() => {
    if (schemeOverride !== undefined) {
      setPreference(schemeOverride);
    }
  }, [schemeOverride]);

  const setScheme = useCallback(
    (next: ThemeScheme) => {
      setPreference(next);
      if (schemeOverride === undefined) {
        void saveThemePreference(next);
      }
    },
    [schemeOverride],
  );

  const theme = useMemo(
    () => (preference === 'light' ? lightTheme : darkTheme),
    [preference],
  );

  const preferenceValue = useMemo(
    () => ({scheme: preference, setScheme}),
    [preference, setScheme],
  );

  return (
    <ThemePreferenceContext.Provider value={preferenceValue}>
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
    </ThemePreferenceContext.Provider>
  );
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (theme === null) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return theme;
}

export function useThemePreference(): ThemePreferenceValue {
  const value = useContext(ThemePreferenceContext);
  if (value === null) {
    throw new Error('useThemePreference must be used within ThemeProvider');
  }
  return value;
}

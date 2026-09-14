import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {getLocale, setActiveLocale, type AppLocale} from './index';
import {
  detectDeviceLocale,
  loadLocalePreference,
  saveLocalePreference,
} from './localePreferenceStore';

type LocaleContextValue = {
  readonly locale: AppLocale;
  readonly setLocale: (locale: AppLocale) => void;
  readonly ready: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export type LocaleProviderProps = {
  readonly children: React.ReactNode;
};

export function LocaleProvider({
  children,
}: LocaleProviderProps): React.JSX.Element {
  const [locale, setLocaleState] = useState<AppLocale>(() => getLocale());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadLocalePreference().then(saved => {
      if (cancelled) {
        return;
      }
      const next = saved ?? detectDeviceLocale();
      setActiveLocale(next);
      setLocaleState(next);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback((next: AppLocale) => {
    setActiveLocale(next);
    setLocaleState(next);
    void saveLocalePreference(next);
  }, []);

  const value = useMemo(
    () => ({locale, setLocale, ready}),
    [locale, ready, setLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

/** Remounts UI when locale changes so static `t()` call sites refresh. */
export function LocaleTree({
  children,
}: {
  readonly children: React.ReactNode;
}): React.JSX.Element {
  const {locale} = useLocale();
  return <React.Fragment key={locale}>{children}</React.Fragment>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (ctx === null) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return ctx;
}

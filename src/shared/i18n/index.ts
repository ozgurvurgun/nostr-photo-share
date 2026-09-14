import {en} from './en';
import {tr, type TrStrings} from './tr';
import {detectDeviceLocale} from './localePreferenceStore';
import type {AppLocale} from './types';

type NestedValue = string | {[key: string]: NestedValue};

const catalogs: Record<AppLocale, NestedValue> = {
  tr: tr as unknown as NestedValue,
  en: en as unknown as NestedValue,
};

let activeLocale: AppLocale = detectDeviceLocale();

export function getLocale(): AppLocale {
  return activeLocale;
}

export function setActiveLocale(locale: AppLocale): void {
  activeLocale = locale;
}

function lookup(path: string, locale: AppLocale): string | undefined {
  const parts = path.split('.');
  let node: NestedValue | undefined = catalogs[locale];
  for (const part of parts) {
    if (node === undefined || typeof node === 'string') {
      return undefined;
    }
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

/** Interpolate `{{key}}` placeholders using the active locale. */
export function t(
  path: string,
  vars?: Readonly<Record<string, string | number>>,
): string {
  const template =
    lookup(path, activeLocale) ??
    lookup(path, 'en') ??
    lookup(path, 'tr') ??
    path;
  if (!vars) {
    return template;
  }
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = vars[key];
    return value === undefined ? `{{${key}}}` : String(value);
  });
}

export type {TrStrings};
export {tr} from './tr';
export {en} from './en';
export type {AppLocale} from './types';
export {SUPPORTED_LOCALES} from './types';

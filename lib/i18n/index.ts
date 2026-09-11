import { getLocales } from 'expo-localization';
import { useFinanceStore } from '@/store/useFinanceStore';
import id from './locales/id';
import en from './locales/en';

export type LanguageCode = 'auto' | 'id' | 'en';
export type ActiveLocale = 'id' | 'en';

export const translations = { id, en };

let currentLanguagePreference: string = 'auto';

export function setLanguagePreference(lang: string) {
  currentLanguagePreference = lang;
}

export function getLanguagePreference(): string {
  try {
    const { useFinanceStore } = require('@/store/useFinanceStore');
    const storeLang = useFinanceStore.getState()?.settings?.language;
    if (storeLang) return storeLang;
  } catch (_) {}
  return currentLanguagePreference;
}

export function resolveDeviceLocale(): ActiveLocale {
  try {
    const locales = getLocales();
    const primary = locales[0]?.languageCode?.toLowerCase();
    if (primary === 'id') return 'id';
    return 'en';
  } catch {
    return 'id';
  }
}

export function getActiveLanguage(languagePreference?: string | null): ActiveLocale {
  if (!languagePreference || languagePreference === 'auto') {
    return resolveDeviceLocale();
  }
  return languagePreference === 'en' ? 'en' : 'id';
}

function getNestedValue(obj: any, path: string): string | undefined {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export function translate(
  key: string,
  params?: Record<string, string | number>,
  localeOverride?: ActiveLocale
): string {
  const settingsLang = getLanguagePreference();
  const activeLocale = localeOverride || getActiveLanguage(settingsLang);
  
  const dict = translations[activeLocale] || translations.id;
  let text = getNestedValue(dict, key);

  if (text === undefined && activeLocale !== 'id') {
    text = getNestedValue(translations.id, key);
  }

  if (text === undefined) {
    return key;
  }

  if (params) {
    for (const [pKey, pVal] of Object.entries(params)) {
      text = text.split('{' + pKey + '}').join(String(pVal));
    }
  }

  return text;
}

export const t = translate;

export function useTranslation() {
  const settingsLang = useFinanceStore((s) => s.settings?.language);
  const activeLocale = getActiveLanguage(settingsLang);

  return {
    locale: activeLocale,
    t: (key: string, params?: Record<string, string | number>) =>
      translate(key, params, activeLocale),
  };
}

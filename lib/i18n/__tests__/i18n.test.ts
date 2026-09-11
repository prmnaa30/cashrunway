import { describe, it, expect, vi } from 'vitest';

vi.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'id', regionCode: 'ID' }],
}));

vi.mock('@/store/useFinanceStore', () => ({
  useFinanceStore: vi.fn(),
}));

import { translate, translations, getActiveLanguage } from '../index';

describe('i18n Localization Engine', () => {
  it('should have matching keys in both id and en locales', () => {
    function getKeys(obj: any, prefix = ''): string[] {
      let keys: string[] = [];
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        const nextPrefix = prefix ? prefix + '.' + key : key;
        if (typeof val === 'object' && val !== null) {
          keys = keys.concat(getKeys(val, nextPrefix));
        } else {
          keys.push(nextPrefix);
        }
      }
      return keys;
    }

    const idKeys = getKeys(translations.id).sort();
    const enKeys = getKeys(translations.en).sort();

    expect(idKeys).toEqual(enKeys);
  });

  it('should interpolate parameters correctly in both languages', () => {
    const idResult = translate(
      'settings.burnWindow.days',
      { days: 14 },
      'id'
    );
    expect(idResult).toBe('14 Hari');

    const enResult = translate(
      'settings.burnWindow.days',
      { days: 14 },
      'en'
    );
    expect(enResult).toBe('14 Days');
  });

  it('should resolve active language correctly', () => {
    expect(getActiveLanguage('en')).toBe('en');
    expect(getActiveLanguage('id')).toBe('id');
    const autoLang = getActiveLanguage('auto');
    expect(['id', 'en']).toContain(autoLang);
  });

  it('should return raw key if translation key does not exist', () => {
    expect(translate('non.existent.key', undefined, 'id')).toBe('non.existent.key');
  });
});

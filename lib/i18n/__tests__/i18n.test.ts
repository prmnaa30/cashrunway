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

  it('should translate all history date range keys in both en and id', () => {
    const keys = [
      'history.quickDateRange',
      'history.customDateRange',
      'history.quickAll',
      'history.quickToday',
      'history.quickYesterday',
      'history.quickThisWeek',
      'history.quickLastWeek',
      'history.quickThisMonth',
      'history.quickLastMonth',
      'history.quickThisYear',
      'history.quickLastYear',
      'history.quickLast7Days',
      'history.quickLast30Days',
      'history.quickLast90Days',
      'history.startDate',
      'history.endDate',
      'history.ok',
      'history.netBalance',
    ];

    for (const key of keys) {
      const enText = translate(key, undefined, 'en');
      const idText = translate(key, undefined, 'id');
      expect(enText).not.toBe(key);
      expect(idText).not.toBe(key);
      expect(typeof enText).toBe('string');
      expect(typeof idText).toBe('string');
      expect(enText.length).toBeGreaterThan(0);
      expect(idText.length).toBeGreaterThan(0);
    }
  });
});

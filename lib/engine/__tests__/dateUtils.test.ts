import { describe, it, expect } from 'vitest';
import {
  parseLocalDate,
  formatLocalDate,
  formatPeriod,
  addDays,
  diffDays,
  getDaysInMonth,
  clampDayOfMonth,
  isSameDay,
} from '../dateUtils';

describe('lib/engine/dateUtils', () => {
  it('should parse and format local dates precisely without time shift', () => {
    const input = '2026-09-08';
    const parsed = parseLocalDate(input);
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(8);
    expect(parsed.getDate()).toBe(8);
    expect(formatLocalDate(parsed)).toBe(input);
  });

  it('should format YYYY-MM period correctly', () => {
    const d = parseLocalDate('2026-09-08');
    expect(formatPeriod(d)).toBe('2026-09');
  });

  it('should add days across month and year boundaries', () => {
    const leapFeb = parseLocalDate('2024-02-28');
    const leapNext = addDays(leapFeb, 1);
    expect(formatLocalDate(leapNext)).toBe('2024-02-29');

    const yearEnd = parseLocalDate('2025-12-31');
    const newYear = addDays(yearEnd, 1);
    expect(formatLocalDate(newYear)).toBe('2026-01-01');
  });

  it('should calculate calendar day difference accurately', () => {
    const start = parseLocalDate('2026-09-01');
    const target = parseLocalDate('2026-09-10');
    expect(diffDays(start, target)).toBe(9);
    expect(diffDays(target, start)).toBe(-9);
    expect(diffDays(start, start)).toBe(0);
  });

  it('should get days in month for leap and non-leap years', () => {
    expect(getDaysInMonth(2024, 2)).toBe(29);
    expect(getDaysInMonth(2025, 2)).toBe(28);
    expect(getDaysInMonth(2026, 4)).toBe(30);
    expect(getDaysInMonth(2026, 12)).toBe(31);
  });

  it('should clamp due day on shorter months', () => {
    expect(clampDayOfMonth(2025, 2, 31)).toBe(28);
    expect(clampDayOfMonth(2024, 2, 31)).toBe(29);
    expect(clampDayOfMonth(2026, 4, 31)).toBe(30);
    expect(clampDayOfMonth(2026, 2, 15)).toBe(15);
  });

  it('should validate same calendar day', () => {
    const d1 = parseLocalDate('2026-09-08');
    const d2 = new Date(2026, 8, 8, 14, 30);
    const d3 = parseLocalDate('2026-09-09');
    expect(isSameDay(d1, d2)).toBe(true);
    expect(isSameDay(d1, d3)).toBe(false);
  });
});

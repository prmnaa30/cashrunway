import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock native modules
vi.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'en-US' }],
}));

vi.mock('@/store/useFinanceStore', () => ({
  useFinanceStore: vi.fn(),
}));

// Import after mocks
import {
  getMonthRange,
  getCurrentMonthRange,
  getLastMonthRange,
  detectRangeMode,
} from '@/lib/utils/dateRange';

// ---------------------------------------------------------------------------
// Pure helper used in filtering tests (defined locally, no import needed)
// ---------------------------------------------------------------------------
function filterTransactions(
  transactions: Array<{ localDate: string; type: string; amount: number }>,
  range: { start: string; end: string }
) {
  return transactions.filter(
    (tx) => tx.localDate >= range.start && tx.localDate <= range.end
  );
}

// ---------------------------------------------------------------------------
// getMonthRange
// ---------------------------------------------------------------------------
describe('getMonthRange(year, month)', () => {
  it('returns correct range for September 2026 (month=8)', () => {
    expect(getMonthRange(2026, 8)).toEqual({ start: '2026-09-01', end: '2026-09-30' });
  });

  it('returns correct range for January 2026 (month=0)', () => {
    expect(getMonthRange(2026, 0)).toEqual({ start: '2026-01-01', end: '2026-01-31' });
  });

  it('returns correct range for February 2024 — leap year (month=1)', () => {
    expect(getMonthRange(2024, 1)).toEqual({ start: '2024-02-01', end: '2024-02-29' });
  });

  it('returns correct range for February 2026 — non-leap year (month=1)', () => {
    expect(getMonthRange(2026, 1)).toEqual({ start: '2026-02-01', end: '2026-02-28' });
  });

  it('returns correct range for December 2026 (month=11)', () => {
    expect(getMonthRange(2026, 11)).toEqual({ start: '2026-12-01', end: '2026-12-31' });
  });
});

// ---------------------------------------------------------------------------
// getCurrentMonthRange
// ---------------------------------------------------------------------------
describe('getCurrentMonthRange()', () => {
  it('start is the first day of the current month in YYYY-MM-DD format', () => {
    const { start } = getCurrentMonthRange();
    const now = new Date();
    const expectedYear = now.getFullYear();
    const expectedMonth = String(now.getMonth() + 1).padStart(2, '0');
    expect(start).toBe(`${expectedYear}-${expectedMonth}-01`);
  });

  it('end is the last day of the current month in YYYY-MM-DD format', () => {
    const { end } = getCurrentMonthRange();
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const expectedYear = now.getFullYear();
    const expectedMonth = String(now.getMonth() + 1).padStart(2, '0');
    const expectedDay = String(lastDay).padStart(2, '0');
    expect(end).toBe(`${expectedYear}-${expectedMonth}-${expectedDay}`);
  });

  it('start and end are both valid YYYY-MM-DD strings', () => {
    const { start, end } = getCurrentMonthRange();
    const iso = /^\d{4}-\d{2}-\d{2}$/;
    expect(start).toMatch(iso);
    expect(end).toMatch(iso);
  });
});

// ---------------------------------------------------------------------------
// getLastMonthRange
// ---------------------------------------------------------------------------
describe('getLastMonthRange()', () => {
  it('returns the month before the current month', () => {
    const now = new Date();
    let expectedYear = now.getFullYear();
    let expectedMonth = now.getMonth() - 1; // 0-indexed
    if (expectedMonth < 0) {
      expectedMonth = 11;
      expectedYear -= 1;
    }
    const expected = getMonthRange(expectedYear, expectedMonth);
    expect(getLastMonthRange()).toEqual(expected);
  });

  it('wraps to December of the previous year when current month is January', () => {
    // Pin the clock to January 15, 2026
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15));

    const { start, end } = getLastMonthRange();
    expect(start).toBe('2025-12-01');
    expect(end).toBe('2025-12-31');

    vi.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// detectRangeMode
// ---------------------------------------------------------------------------
describe('detectRangeMode(range)', () => {
  it("returns 'thisMonth' when range equals getCurrentMonthRange()", () => {
    expect(detectRangeMode(getCurrentMonthRange())).toBe('thisMonth');
  });

  it("returns 'lastMonth' when range equals getLastMonthRange()", () => {
    expect(detectRangeMode(getLastMonthRange())).toBe('lastMonth');
  });

  it("returns 'custom' for an arbitrary multi-month range", () => {
    expect(detectRangeMode({ start: '2025-01-01', end: '2025-03-31' })).toBe('custom');
  });

  it("returns 'custom' for a range that is neither this nor last month", () => {
    expect(detectRangeMode({ start: '2020-06-01', end: '2020-06-30' })).toBe('custom');
  });
});

// ---------------------------------------------------------------------------
// filterTransactions — pure boundary logic
// ---------------------------------------------------------------------------
describe('filterTransactions(transactions, range)', () => {
  const txns = [
    { localDate: '2026-08-31', type: 'expense', amount: 50 },  // before range
    { localDate: '2026-09-01', type: 'expense', amount: 100 }, // start boundary
    { localDate: '2026-09-15', type: 'income',  amount: 200 }, // inside range
    { localDate: '2026-09-30', type: 'expense', amount: 75 },  // end boundary
    { localDate: '2026-10-01', type: 'income',  amount: 300 }, // after range
  ];

  const range = { start: '2026-09-01', end: '2026-09-30' };

  it('includes transactions at the start boundary (inclusive)', () => {
    const result = filterTransactions(txns, range);
    expect(result.some((t) => t.localDate === '2026-09-01')).toBe(true);
  });

  it('includes transactions at the end boundary (inclusive)', () => {
    const result = filterTransactions(txns, range);
    expect(result.some((t) => t.localDate === '2026-09-30')).toBe(true);
  });

  it('excludes transactions before the start date', () => {
    const result = filterTransactions(txns, range);
    expect(result.some((t) => t.localDate === '2026-08-31')).toBe(false);
  });

  it('excludes transactions after the end date', () => {
    const result = filterTransactions(txns, range);
    expect(result.some((t) => t.localDate === '2026-10-01')).toBe(false);
  });

  it('returns an empty array when no transactions fall within the range', () => {
    const emptyRange = { start: '2025-01-01', end: '2025-01-31' };
    expect(filterTransactions(txns, emptyRange)).toEqual([]);
  });

  it('returns all transactions when the range covers all dates', () => {
    const wideRange = { start: '2020-01-01', end: '2099-12-31' };
    expect(filterTransactions(txns, wideRange)).toHaveLength(txns.length);
  });
});

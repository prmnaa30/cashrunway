import { EngineTransaction, BurnRateResult } from './types';
import { parseLocalDate, diffDays } from './dateUtils';

export interface CalculateRollingBurnRateOptions {
  transactions: EngineTransaction[];
  burnWindowDays: number;
  fallbackDailyBurn: number;
  todayDate: string;
}

/**
 * Calculates the rolling daily variable burn rate.
 * - Outliers (isOutlier = true) and fixed expenses (isCategoryFixed = true) are excluded.
 * - Transfer admin fees are included as variable expenses.
 * - Cold-start guard: Uses fallbackDailyBurn if transaction history span is less than 5 days.
 */
export function calculateRollingBurnRate(
  options: CalculateRollingBurnRateOptions
): BurnRateResult {
  const { transactions, burnWindowDays, fallbackDailyBurn, todayDate } = options;

  if (!transactions || transactions.length === 0) {
    return {
      dailyBurnRate: fallbackDailyBurn,
      effectiveDays: Math.max(1, burnWindowDays),
      isColdStart: true,
      totalVariableExpense: 0,
    };
  }

  const today = parseLocalDate(todayDate);

  let earliestDate: Date | null = null;
  for (const tx of transactions) {
    const txDate = parseLocalDate(tx.localDate);
    if (diffDays(txDate, today) >= 0) {
      if (!earliestDate || diffDays(txDate, earliestDate) > 0) {
        earliestDate = txDate;
      }
    }
  }

  if (!earliestDate) {
    return {
      dailyBurnRate: fallbackDailyBurn,
      effectiveDays: Math.max(1, burnWindowDays),
      isColdStart: true,
      totalVariableExpense: 0,
    };
  }

  const historySpanDays = diffDays(earliestDate, today) + 1;
  const isColdStart = historySpanDays < 5;
  const effectiveDays = Math.max(1, Math.min(burnWindowDays, historySpanDays));

  let totalVariableExpense = 0;

  for (const tx of transactions) {
    const txDate = parseLocalDate(tx.localDate);
    const daysAgo = diffDays(txDate, today);

    if (daysAgo < 0 || daysAgo >= burnWindowDays) {
      continue;
    }

    if (tx.isOutlier || tx.isCategoryFixed) {
      continue;
    }

    if (tx.type === 'expense') {
      totalVariableExpense += tx.amount;
    } else if (tx.type === 'transfer') {
      totalVariableExpense += tx.fee || 0;
    }
  }

  const dailyBurnRate = isColdStart
    ? fallbackDailyBurn
    : Math.round((totalVariableExpense / effectiveDays) * 100) / 100;

  return {
    dailyBurnRate,
    effectiveDays,
    isColdStart,
    totalVariableExpense,
  };
}

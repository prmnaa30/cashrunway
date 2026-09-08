import {
  EngineRecurringBill,
  EngineSettings,
  EngineTransaction,
  SafeSpendResult,
} from './types';
import {
  parseLocalDate,
  formatLocalDate,
  diffDays,
  clampDayOfMonth,
  formatPeriod,
  addDays,
} from './dateUtils';

export interface CalculateSafeDailySpendOptions {
  operationalBalance: number;
  recurringBills: EngineRecurringBill[];
  transactions: EngineTransaction[];
  settings: EngineSettings;
  /** Date in YYYY-MM-DD format */
  todayDate: string;
}

/**
 * Calculates the safe daily allowance until the next payday/target date.
 * - Auto-advances to the next month's payday if today >= paydayDay.
 * - Deducts active recurring bills that fall between today and targetDate.
 * - Deducts today's variable expenses from the base daily allowance.
 */
export function calculateSafeDailySpend(
  options: CalculateSafeDailySpendOptions
): SafeSpendResult {
  const { operationalBalance, recurringBills, transactions, settings, todayDate } = options;

  const today = parseLocalDate(todayDate);
  const todayDay = today.getDate();
  const todayMonth = today.getMonth() + 1;
  const todayYear = today.getFullYear();

  let targetDateObj: Date;

  if (settings.targetDate && diffDays(today, parseLocalDate(settings.targetDate)) > 0) {
    targetDateObj = parseLocalDate(settings.targetDate);
  } else {
    const paydayDay = settings.paydayDay || 25;
    let targetYear = todayYear;
    let targetMonth = todayMonth;

    if (todayDay >= paydayDay) {
      if (todayMonth === 12) {
        targetYear = todayYear + 1;
        targetMonth = 1;
      } else {
        targetMonth = todayMonth + 1;
      }
    }

    const clampedDay = clampDayOfMonth(targetYear, targetMonth, paydayDay);
    targetDateObj = new Date(targetYear, targetMonth - 1, clampedDay, 0, 0, 0, 0);
  }

  const targetDateStr = formatLocalDate(targetDateObj);
  const daysRemaining = Math.max(1, diffDays(today, targetDateObj));

  let unpaidBillsTotal = 0;

  for (let d = 0; d < daysRemaining; d++) {
    const simDate = addDays(today, d);
    const simYear = simDate.getFullYear();
    const simMonth = simDate.getMonth() + 1;
    const simDay = simDate.getDate();
    const simPeriod = formatPeriod(simDate);

    for (const bill of recurringBills) {
      if (!bill.isActive) continue;

      const clampedDue = clampDayOfMonth(simYear, simMonth, bill.dueDay);
      if (simDay === clampedDue) {
        if (bill.lastPaidPeriod !== simPeriod) {
          unpaidBillsTotal += bill.amount;
        }
      }
    }
  }

  const availableCash = Math.max(0, operationalBalance - unpaidBillsTotal);
  const baseDailyAllowance = Math.round((availableCash / daysRemaining) * 100) / 100;

  let todaySpent = 0;
  for (const tx of transactions) {
    if (tx.localDate !== todayDate) continue;
    if (tx.isOutlier || tx.isCategoryFixed) continue;

    if (tx.type === 'expense') {
      todaySpent += tx.amount;
    } else if (tx.type === 'transfer') {
      todaySpent += tx.fee || 0;
    }
  }

  const remainingDailyAllowance =
    Math.round((baseDailyAllowance - todaySpent) * 100) / 100;

  return {
    targetDate: targetDateStr,
    daysRemaining,
    unpaidBillsTotal,
    baseDailyAllowance,
    todaySpent,
    remainingDailyAllowance,
    isOverspent: remainingDailyAllowance < 0,
  };
}

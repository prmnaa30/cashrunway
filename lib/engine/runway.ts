import { EngineRecurringBill, RunwayResult, RunwayStatus } from './types';
import {
  parseLocalDate,
  formatLocalDate,
  addDays,
  clampDayOfMonth,
  formatPeriod,
} from './dateUtils';

export interface CalculateDiscreteRunwayOptions {
  operationalBalance: number;
  vaultBalance?: number;
  dailyBurnRate: number;
  recurringBills: EngineRecurringBill[];
  /** Date in YYYY-MM-DD format */
  todayDate: string;
  /** Maximum simulation horizon in days (default: 1095) */
  maxHorizonDays?: number;
}

/**
 * Calculates discrete daily runway with O(K) day-by-day calendar simulation.
 * - Deducts daily variable burn rate.
 * - Deducts recurring bills clamped to valid month days (e.g. Feb 28/29, Apr 30).
 * - Protects against double-counting current month's bills if already paid.
 * - Tracks both Operational Runway (active cash) and Emergency Runway (active cash + vault).
 */
export function calculateDiscreteRunway(
  options: CalculateDiscreteRunwayOptions
): RunwayResult {
  const {
    operationalBalance,
    vaultBalance = 0,
    dailyBurnRate,
    recurringBills,
    todayDate,
    maxHorizonDays = 1095,
  } = options;

  let currentOperational = operationalBalance;
  let currentEmergency = operationalBalance + vaultBalance;

  if (currentOperational <= 0 && currentEmergency <= 0) {
    return {
      operationalRunwayDays: 0,
      operationalProjectedDate: todayDate,
      emergencyRunwayDays: 0,
      emergencyProjectedDate: todayDate,
      isDepleted: true,
      isInfinite: false,
      status: 'critical',
    };
  }

  const activeBillsTotal = recurringBills
    .filter((b) => b.isActive)
    .reduce((sum, b) => sum + b.amount, 0);

  if (dailyBurnRate <= 0 && activeBillsTotal <= 0) {
    return {
      operationalRunwayDays: maxHorizonDays,
      operationalProjectedDate: null,
      emergencyRunwayDays: maxHorizonDays,
      emergencyProjectedDate: null,
      isDepleted: false,
      isInfinite: true,
      status: 'healthy',
    };
  }

  const initialDate = parseLocalDate(todayDate);
  const startPeriod = formatPeriod(initialDate);

  let operationalRunwayDays: number | null = operationalBalance <= 0 ? 0 : null;
  let operationalProjectedDate: string | null = operationalBalance <= 0 ? todayDate : null;

  let emergencyRunwayDays: number | null = currentEmergency <= 0 ? 0 : null;
  let emergencyProjectedDate: string | null = currentEmergency <= 0 ? todayDate : null;

  for (let d = 0; d <= maxHorizonDays; d++) {
    const simDate = addDays(initialDate, d);
    const simYear = simDate.getFullYear();
    const simMonth = simDate.getMonth() + 1;
    const simDay = simDate.getDate();
    const simPeriod = formatPeriod(simDate);

    let billsDueToday = 0;
    for (const bill of recurringBills) {
      if (!bill.isActive) continue;

      const clampedDueDay = clampDayOfMonth(simYear, simMonth, bill.dueDay);
      if (simDay === clampedDueDay) {
        if (simPeriod === startPeriod && bill.lastPaidPeriod === startPeriod) {
          continue;
        }
        billsDueToday += bill.amount;
      }
    }

    const todayExpense = dailyBurnRate + billsDueToday;

    if (operationalRunwayDays === null) {
      if (currentOperational >= todayExpense) {
        currentOperational -= todayExpense;
      } else {
        operationalRunwayDays = d;
        operationalProjectedDate = formatLocalDate(simDate);
      }
    }

    if (emergencyRunwayDays === null) {
      if (currentEmergency >= todayExpense) {
        currentEmergency -= todayExpense;
      } else {
        emergencyRunwayDays = d;
        emergencyProjectedDate = formatLocalDate(simDate);
      }
    }

    if (operationalRunwayDays !== null && emergencyRunwayDays !== null) {
      break;
    }
  }

  const finalOperationalDays =
    operationalRunwayDays !== null ? operationalRunwayDays : maxHorizonDays;
  const finalEmergencyDays =
    emergencyRunwayDays !== null ? emergencyRunwayDays : maxHorizonDays;

  let status: RunwayStatus = 'healthy';
  if (finalOperationalDays < 7) {
    status = 'critical';
  } else if (finalOperationalDays <= 30) {
    status = 'warning';
  }

  return {
    operationalRunwayDays: finalOperationalDays,
    operationalProjectedDate: operationalProjectedDate,
    emergencyRunwayDays: finalEmergencyDays,
    emergencyProjectedDate: emergencyProjectedDate,
    isDepleted: finalOperationalDays === 0,
    isInfinite: operationalRunwayDays === null && emergencyRunwayDays === null,
    status,
  };
}

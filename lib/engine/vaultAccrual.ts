import { EngineWallet, VaultAccrualResult } from './types';
import { parseLocalDate, diffDays } from './dateUtils';

export interface CalculateVaultAccrualOptions {
  wallet: EngineWallet;
  /** Date in YYYY-MM-DD format */
  todayDate: string;
}

/**
 * Calculates daily interest accrual and generates offline catch-up transactions.
 * - Daily Gross Interest = (Balance * InterestRate) / 365
 * - PPh Final 20% Tax applies if balance > Rp 7,500,000 and autoTax is true.
 * - Multi-day catch-up produces a single consolidated income transaction.
 */
export function calculateVaultAccrual(
  options: CalculateVaultAccrualOptions
): VaultAccrualResult {
  const { wallet, todayDate } = options;

  const emptyResult: VaultAccrualResult = {
    walletId: wallet.id,
    walletName: wallet.name,
    missedDays: 0,
    totalGrossInterest: 0,
    totalTax: 0,
    totalNetInterest: 0,
    newLastAccruedDate: wallet.lastAccruedDate || todayDate,
  };

  if (
    !wallet.isVault ||
    !wallet.isInterestEnabled ||
    wallet.interestRate <= 0 ||
    wallet.balance <= 0 ||
    !wallet.lastAccruedDate
  ) {
    return emptyResult;
  }

  const lastAccrued = parseLocalDate(wallet.lastAccruedDate);
  const today = parseLocalDate(todayDate);
  const missedDays = Math.max(0, diffDays(lastAccrued, today));

  if (missedDays === 0) {
    return emptyResult;
  }

  const dailyGross = (wallet.balance * wallet.interestRate) / 365;
  const isTaxable = wallet.balance > 7500000 && wallet.autoTax;
  const dailyTax = isTaxable ? dailyGross * 0.2 : 0;
  const dailyNet = dailyGross - dailyTax;

  const totalGrossInterest = Math.round(dailyGross * missedDays * 100) / 100;
  const totalTax = Math.round(dailyTax * missedDays * 100) / 100;
  const totalNetInterest = Math.round(dailyNet * missedDays * 100) / 100;

  let suggestedTransaction;
  if (totalNetInterest > 0) {
    suggestedTransaction = {
      type: 'income' as const,
      amount: totalNetInterest,
      walletId: wallet.id,
      date: `${todayDate}T00:00:00.000Z`,
      localDate: todayDate,
      note: `Bunga Vault (${missedDays} hari akrual)`,
    };
  }

  return {
    walletId: wallet.id,
    walletName: wallet.name,
    missedDays,
    totalGrossInterest,
    totalTax,
    totalNetInterest,
    newLastAccruedDate: todayDate,
    suggestedTransaction,
  };
}

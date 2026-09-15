import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Sparkles, MoreVertical } from 'lucide-react-native';
import { formatCurrency, formatDate } from '@/lib/format';
import { Wallet } from '@/lib/db';
import { VaultAccrualResult } from '@/lib/engine';
import Colors from '@/constants/Colors';
import { useTranslation } from '@/lib/i18n';

interface VaultCardProps {
  wallet: Wallet;
  pendingAccrual?: VaultAccrualResult;
  isPrivacyMode: boolean;
  colorScheme: 'light' | 'dark';
  onAccrue?: (walletId: string) => void;
  onOpenOptions?: (wallet: Wallet) => void;
}

export function VaultCard({
  wallet,
  pendingAccrual,
  isPrivacyMode,
  colorScheme,
  onAccrue,
  onOpenOptions,
}: VaultCardProps) {
  const { t } = useTranslation();
  const colors = Colors[colorScheme];

  // Daily yield calculation for this specific vault
  const dailyGross = (wallet.balance * (wallet.interestRate || 0)) / 365;
  const threshold = wallet.taxThreshold !== undefined && wallet.taxThreshold !== null ? wallet.taxThreshold : 7500000;
  const rate = wallet.taxRate !== undefined && wallet.taxRate !== null ? wallet.taxRate : 0.2;
  const isTaxable = wallet.balance > threshold && Boolean(wallet.autoTax);
  const dailyNet = isTaxable ? dailyGross * (1 - rate) : dailyGross;

  const hasPendingInterest =
    Boolean(pendingAccrual && pendingAccrual.totalNetInterest > 0 && pendingAccrual.missedDays > 0);

  const getTaxLabel = () => {
    if (!wallet.autoTax) return t('wallets.vaultTaxFree');
    if (threshold > 0) {
      const thresholdStr = threshold >= 1000000 ? `${threshold / 1000000}jt` : String(threshold);
      return t('wallets.vaultTaxLabel')
        .replace('{rate}', String((rate * 100).toFixed(0)))
        .replace('{threshold}', thresholdStr);
    }
    return t('wallets.vaultTaxSimple').replace('{rate}', String((rate * 100).toFixed(0)));
  };

  return (
    <View className="p-4 rounded-2xl bg-linen-card dark:bg-cypress-card border border-linen-border dark:border-cypress-border mb-3">
      <View className="flex-row items-center justify-between mb-1.5">
        <View className="flex-row items-center flex-1 mr-2">
          <Text
            numberOfLines={1}
            className="text-sm font-bold text-linen-text-primary dark:text-cypress-text-primary mr-2 flex-shrink"
          >
            {wallet.name}
          </Text>
          <View className="px-2 py-0.5 rounded bg-accent-brass/15 dark:bg-accent-champagne/15 border border-accent-brass/30 dark:border-accent-champagne/30">
            <Text className="text-[10px] font-bold text-accent-brass dark:text-accent-champagne font-mono tabular-nums">
              {((wallet.interestRate || 0) * 100).toFixed(2)}% p.a.
            </Text>
          </View>
        </View>

        {onOpenOptions && (
          <Pressable
            onPress={() => onOpenOptions(wallet)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="min-w-[44px] min-h-[44px] rounded-lg items-center justify-center active:opacity-60"
            accessibilityLabel={t('wallets.vaultOptionsLabel').replace('{name}', wallet.name)}
          >
            <MoreVertical size={16} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      <Text className="text-2xl font-black font-mono tracking-tight tabular-nums text-linen-text-primary dark:text-cypress-text-primary mt-1 mb-0.5">
        {formatCurrency(wallet.balance, isPrivacyMode)}
      </Text>

      {wallet.isInterestEnabled === 1 && wallet.balance > 0 && (
        <View className="flex-row items-center mb-1">
          <Sparkles size={12} color="#10B981" />
          <Text className="text-[11px] font-semibold text-status-safe ml-1 tabular-nums">
            +{formatCurrency(dailyNet, isPrivacyMode)}{t('wallets.vaultDailyNet')}
          </Text>
          <Text className="text-[10px] text-linen-text-secondary dark:text-cypress-text-secondary ml-1">
            {t('wallets.vaultNetLabel').replace('{taxSuffix}', isTaxable ? t('wallets.vaultNetAfterTax') : '')}
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-linen-border/60 dark:border-cypress-border/60">
        <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary tabular-nums">
          {getTaxLabel()}
        </Text>
        <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary">
          {t('wallets.vaultLastClaimed')}{' '}
          {wallet.lastAccruedDate ? formatDate(wallet.lastAccruedDate) : t('wallets.vaultNeverClaimed')}
        </Text>
      </View>

      {hasPendingInterest && pendingAccrual && (
        <Pressable
          onPress={() => onAccrue?.(wallet.id)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="mt-3 min-h-[44px] py-2.5 px-3.5 rounded-xl bg-cypress-surface dark:bg-accent-champagne flex-row items-center justify-between active:opacity-80 shadow-xs"
          accessibilityLabel={t('wallets.vaultClaimButton').replace('{days}', String(pendingAccrual.missedDays))}
        >
          <View className="flex-row items-center">
            <Sparkles size={14} color={colorScheme === 'dark' ? '#0C1513' : '#D4AF37'} />
            <Text className="ml-1.5 text-xs font-bold text-white dark:text-[#0C1513] tabular-nums">
              {t('wallets.vaultClaimButton').replace('{days}', String(pendingAccrual.missedDays))}
            </Text>
          </View>
          <Text className="text-xs font-black font-mono tabular-nums text-accent-champagne dark:text-[#0C1513]">
            +{formatCurrency(pendingAccrual.totalNetInterest, isPrivacyMode)}
          </Text>
        </Pressable>
      )}
    </View>
  );
}



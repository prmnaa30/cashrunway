import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Sparkles, MoreVertical } from 'lucide-react-native';
import { formatCurrency, formatDate } from '@/lib/format';
import { Wallet } from '@/lib/db';
import { VaultAccrualResult } from '@/lib/engine';
import Colors from '@/constants/Colors';

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
  const colors = Colors[colorScheme];

  // Daily yield calculation for this specific vault
  const dailyGross = (wallet.balance * (wallet.interestRate || 0)) / 365;
  const threshold = wallet.taxThreshold !== undefined && wallet.taxThreshold !== null ? wallet.taxThreshold : 7500000;
  const rate = wallet.taxRate !== undefined && wallet.taxRate !== null ? wallet.taxRate : 0.2;
  const isTaxable = wallet.balance > threshold && Boolean(wallet.autoTax);
  const dailyNet = isTaxable ? dailyGross * (1 - rate) : dailyGross;

  const hasPendingInterest =
    Boolean(pendingAccrual && pendingAccrual.totalNetInterest > 0 && pendingAccrual.missedDays > 0);

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
            <Text className="text-[10px] font-bold text-accent-brass dark:text-accent-champagne font-mono">
              {((wallet.interestRate || 0) * 100).toFixed(2)}% p.a.
            </Text>
          </View>
        </View>

        {onOpenOptions && (
          <Pressable
            onPress={() => onOpenOptions(wallet)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-8 h-8 rounded-lg items-center justify-center active:opacity-60"
            accessibilityLabel={`Opsi ${wallet.name}`}
          >
            <MoreVertical size={16} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      <Text className="text-2xl font-black font-mono tracking-tight text-linen-text-primary dark:text-cypress-text-primary mt-1 mb-0.5">
        {formatCurrency(wallet.balance, isPrivacyMode)}
      </Text>

      {wallet.isInterestEnabled === 1 && wallet.balance > 0 && (
        <View className="flex-row items-center mb-1">
          <Sparkles size={12} color="#10B981" />
          <Text className="text-[11px] font-semibold text-status-safe ml-1">
            +{formatCurrency(dailyNet, isPrivacyMode)}/hari
          </Text>
          <Text className="text-[10px] text-linen-text-secondary dark:text-cypress-text-secondary ml-1">
            (bersih{isTaxable ? ' setelah pajak' : ''})
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-linen-border/60 dark:border-cypress-border/60">
        <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary">
          {wallet.autoTax
            ? threshold > 0
              ? `Pajak ${(rate * 100).toFixed(0)}% (>${threshold >= 1000000 ? `${threshold / 1000000}jt` : threshold})`
              : `Pajak ${(rate * 100).toFixed(0)}%`
            : 'Bebas Pajak'}
        </Text>
        <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary">
          Terakhir diambil:{' '}
          {wallet.lastAccruedDate ? formatDate(wallet.lastAccruedDate) : 'Belum'}
        </Text>
      </View>

      {hasPendingInterest && pendingAccrual && (
        <Pressable
          onPress={() => onAccrue?.(wallet.id)}
          className="mt-3 py-2.5 px-3.5 rounded-xl bg-cypress-surface dark:bg-accent-champagne flex-row items-center justify-between active:opacity-80 shadow-xs"
          accessibilityLabel={`Ambil bunga ${wallet.name}`}
        >
          <View className="flex-row items-center">
            <Sparkles size={14} color={colorScheme === 'dark' ? '#0C1513' : '#D4AF37'} />
            <Text className="ml-1.5 text-xs font-bold text-white dark:text-[#0C1513]">
              Ambil Bunga ({pendingAccrual.missedDays} hari)
            </Text>
          </View>
          <Text className="text-xs font-black font-mono text-accent-champagne dark:text-[#0C1513]">
            +{formatCurrency(pendingAccrual.totalNetInterest, isPrivacyMode)}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

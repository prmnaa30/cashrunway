import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Shield } from 'lucide-react-native';
import { formatCurrency } from '@/lib/format';
import { SafeSpendResult } from '@/lib/engine';
import Colors from '@/constants/Colors';

interface SafeSpendCardProps {
  safeSpend: SafeSpendResult;
  isPrivacyMode: boolean;
  colorScheme: 'light' | 'dark';
}

export function SafeSpendCard({
  safeSpend,
  isPrivacyMode,
  colorScheme,
}: SafeSpendCardProps) {
  const colors = Colors[colorScheme];

  const spendPercent = useMemo(() => {
    if (safeSpend.baseDailyAllowance <= 0) return safeSpend.todaySpent > 0 ? 100 : 0;
    return Math.min(
      100,
      Math.round((safeSpend.todaySpent / safeSpend.baseDailyAllowance) * 100)
    );
  }, [safeSpend]);

  return (
    <View className="rounded-3xl bg-linen-card dark:bg-cypress-card border border-linen-border dark:border-cypress-border p-5 mb-4">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <Shield size={16} color={colors.tint} />
          <Text className="ml-1.5 text-xs font-bold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary">
            Batas Aman Belanja Hari Ini
          </Text>
        </View>

        <View
          className={`px-2 py-0.5 rounded-full ${
            safeSpend.isOverspent ? 'bg-status-danger/15' : 'bg-status-safe/15'
          }`}
        >
          <Text
            className={`text-[11px] font-bold ${
              safeSpend.isOverspent ? 'text-status-danger' : 'text-status-safe'
            }`}
          >
            {safeSpend.isOverspent ? 'Kelewatan' : 'Masih Aman'}
          </Text>
        </View>
      </View>

      <View className="my-2">
        <Text
          className={`text-3xl font-black tracking-tight ${
            safeSpend.isOverspent
              ? 'text-status-danger'
              : 'text-linen-text-primary dark:text-cypress-text-primary'
          }`}
        >
          {formatCurrency(safeSpend.remainingDailyAllowance, isPrivacyMode)}
        </Text>
        <Text className="mt-0.5 text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
          {safeSpend.isOverspent
            ? 'Pengeluaran hari ini sudah melebihi batas yang disarankan'
            : 'Sisa uang yang aman kamu jajanin sampai nanti malam'}
        </Text>
      </View>

      <View className="mt-3 mb-2">
        <View className="h-1.5 w-full bg-linen-surface dark:bg-cypress-surface rounded-full overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${spendPercent}%`,
              backgroundColor: safeSpend.isOverspent ? '#EF4444' : colors.tint,
            }}
          />
        </View>
        <View className="flex-row justify-between mt-1">
          <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary">
            Sudah keluar: {formatCurrency(safeSpend.todaySpent, isPrivacyMode)}
          </Text>
          <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary">
            Jatah: {formatCurrency(safeSpend.baseDailyAllowance, isPrivacyMode)}
          </Text>
        </View>
      </View>

      <View className="mt-3 pt-3 border-t border-linen-border/60 dark:border-cypress-border/60 flex-row justify-between">
        <View>
          <Text className="text-[10px] uppercase font-semibold text-linen-text-secondary dark:text-cypress-text-secondary tracking-wider">
            Alokasi Tagihan Rutin
          </Text>
          <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary mt-0.5">
            {formatCurrency(safeSpend.unpaidBillsTotal, isPrivacyMode)}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-[10px] uppercase font-semibold text-linen-text-secondary dark:text-cypress-text-secondary tracking-wider">
            Menuju Gajian
          </Text>
          <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary mt-0.5">
            {safeSpend.daysRemaining} hari lagi
          </Text>
        </View>
      </View>
    </View>
  );
}

import React from 'react';
import { View, Text } from 'react-native';
import { formatCurrency, formatDate } from '@/lib/format';
import { Wallet } from '@/lib/db';

interface VaultCardProps {
  wallet: Wallet;
  isPrivacyMode: boolean;
  colorScheme: 'light' | 'dark';
}

export function VaultCard({
  wallet,
  isPrivacyMode,
}: VaultCardProps) {
  return (
    <View className="p-4 rounded-2xl bg-linen-card dark:bg-cypress-card border border-linen-border dark:border-cypress-border mb-3">
      <View className="flex-row items-center justify-between mb-1.5">
        <Text className="text-sm font-bold text-linen-text-primary dark:text-cypress-text-primary">
          {wallet.name}
        </Text>
        <Text className="text-xs font-bold font-mono text-accent-brass dark:text-accent-champagne">
          {(wallet.interestRate * 100).toFixed(2)}% p.a.
        </Text>
      </View>

      <Text className="text-2xl font-black font-mono tracking-tight text-linen-text-primary dark:text-cypress-text-primary my-1">
        {formatCurrency(wallet.balance, isPrivacyMode)}
      </Text>

      <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-linen-border/60 dark:border-cypress-border/60">
        <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary">
          {wallet.autoTax ? 'Pajak 20% otomatis (>7.5jt)' : 'Bebas Pajak'}
        </Text>
        <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary">
          Terakhir dihitung:{' '}
          {wallet.lastAccruedDate ? formatDate(wallet.lastAccruedDate) : 'Belum'}
        </Text>
      </View>
    </View>
  );
}

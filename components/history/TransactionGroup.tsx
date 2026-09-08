import React from 'react';
import { View, Text } from 'react-native';
import { formatCurrency } from '@/lib/format';
import { TransactionWithDetails } from '@/lib/db';
import { TransactionItem } from './TransactionItem';

interface TransactionGroupProps {
  date: string;
  label: string;
  netAmount: number;
  items: TransactionWithDetails[];
  isPrivacyMode: boolean;
  colorScheme: 'light' | 'dark';
  onDelete: (tx: TransactionWithDetails) => void;
}

export function TransactionGroup({
  label,
  netAmount,
  items,
  isPrivacyMode,
  colorScheme,
  onDelete,
}: TransactionGroupProps) {
  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between pb-2 mb-1 px-1">
        <Text className="text-xs font-bold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary">
          {label}
        </Text>

        {netAmount !== 0 && (
          <Text
            className={`text-xs font-mono font-medium ${
              netAmount > 0
                ? 'text-status-safe'
                : 'text-linen-text-secondary dark:text-cypress-text-secondary'
            }`}
          >
            {netAmount > 0 ? '+' : ''}
            {formatCurrency(netAmount, isPrivacyMode)}
          </Text>
        )}
      </View>

      <View className="rounded-2xl bg-linen-card dark:bg-cypress-card border border-linen-border dark:border-cypress-border divide-y divide-linen-border/60 dark:divide-cypress-border/60 overflow-hidden">
        {items.map((tx) => (
          <TransactionItem
            key={tx.id}
            tx={tx}
            isPrivacyMode={isPrivacyMode}
            colorScheme={colorScheme}
            onDelete={onDelete}
          />
        ))}
      </View>
    </View>
  );
}

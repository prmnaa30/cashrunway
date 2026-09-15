import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { formatCurrency } from '@/lib/format';
import { TransactionWithDetails } from '@/lib/db';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import Colors from '@/constants/Colors';

interface TransactionItemProps {
  tx: TransactionWithDetails;
  isPrivacyMode: boolean;
  colorScheme: 'light' | 'dark';
  onDelete: (tx: TransactionWithDetails) => void;
  onEdit?: (tx: TransactionWithDetails) => void;
}

export function TransactionItem({
  tx,
  isPrivacyMode,
  colorScheme,
  onDelete,
  onEdit,
}: TransactionItemProps) {
  const colors = Colors[colorScheme];

  const title =
    tx.note ||
    tx.category?.name ||
    (tx.type === 'transfer' ? 'Transfer Saldo' : 'Penyesuaian Saldo');

  const sourceAccount = tx.wallet?.name || 'Kas';
  const targetAccount = tx.targetWallet?.name;

  const timeStr = tx.date.includes(' ')
    ? tx.date.split(' ')[1]?.substring(0, 5)
    : '';

  const subtitle =
    tx.type === 'transfer'
      ? `${sourceAccount} → ${targetAccount || 'Tujuan'}`
      : [tx.category?.name, sourceAccount, timeStr].filter(Boolean).join(' • ');

  return (
    <Pressable
      onPress={() => onEdit?.(tx)}
      className="p-3.5 min-h-[48px] flex-row items-center justify-between active:bg-linen-surface/60 dark:active:bg-cypress-surface/60"
    >
      <View className="flex-row items-center flex-1 mr-3">
        <View
          className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
            tx.type === 'income'
              ? 'bg-status-safe/10 border border-status-safe/25'
              : tx.type === 'transfer'
              ? 'bg-accent-brass/10 dark:bg-accent-champagne/10 border border-accent-brass/25 dark:border-accent-champagne/25'
              : 'bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border'
          }`}
        >
          <CategoryIcon
            categoryId={tx.categoryId}
            type={tx.type}
            size={18}
            color={
              tx.type === 'income'
                ? '#10B981'
                : tx.type === 'transfer'
                ? colorScheme === 'dark'
                  ? '#D4AF37'
                  : '#B8860B'
                : colors.text
            }
          />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center">
            <Text
              className="text-sm font-bold text-linen-text-primary dark:text-cypress-text-primary"
              numberOfLines={1}
            >
              {title}
            </Text>
            {Boolean(tx.isOutlier) && (
              <View className="ml-1.5 px-1.5 py-0.2 rounded bg-status-warning/15 border border-status-warning/30">
                <Text className="text-[9px] font-bold text-status-warning uppercase">
                  Anomali
                </Text>
              </View>
            )}
          </View>
          <Text
            className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary mt-0.5"
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        </View>
      </View>

      <View className="items-end flex-row items-center space-x-2">
        <View className="items-end">
          <Text
            className={`text-sm font-bold font-mono tracking-tight tabular-nums ${
              tx.type === 'expense'
                ? 'text-status-danger'
                : tx.type === 'income'
                ? 'text-status-safe'
                : 'text-linen-text-primary dark:text-cypress-text-primary'
            }`}
          >
            {tx.type === 'expense'
              ? `-${formatCurrency(tx.amount, isPrivacyMode)}`
              : tx.type === 'income'
              ? `+${formatCurrency(tx.amount, isPrivacyMode)}`
              : formatCurrency(tx.amount, isPrivacyMode)}
          </Text>

          {tx.type === 'transfer' && tx.fee > 0 && (
            <Text className="text-[10px] text-linen-text-secondary dark:text-cypress-text-secondary tabular-nums">
              fee {formatCurrency(tx.fee, isPrivacyMode)}
            </Text>
          )}
        </View>

        <Pressable
          onPress={() => onDelete(tx)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="ml-2.5 min-w-[44px] min-h-[44px] items-center justify-center rounded-lg active:bg-status-danger/10"
          accessibilityLabel="Hapus transaksi"
        >
          <Trash2 size={16} color={colors.textSecondary} />
        </Pressable>
      </View>
    </Pressable>
  );
}

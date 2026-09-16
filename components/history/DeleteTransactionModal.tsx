import React from 'react';
import {
  View,
  Text,
  Pressable,
} from 'react-native';
import { Trash2, RotateCcw } from 'lucide-react-native';
import { formatCurrency } from '@/lib/format';
import { TransactionWithDetails } from '@/lib/db';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { AppModal } from '@/components/ui/AppModal';
import { useTranslation } from '@/lib/i18n';
import Colors from '@/constants/Colors';

export interface DeleteTransactionModalProps {
  visible: boolean;
  transaction: TransactionWithDetails | null;
  isPrivacyMode: boolean;
  colorScheme: 'light' | 'dark';
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteTransactionModal({
  visible,
  transaction,
  isPrivacyMode,
  colorScheme,
  onClose,
  onConfirm,
}: DeleteTransactionModalProps) {
  const { t, locale } = useTranslation();
  const colors = Colors[colorScheme];

  if (!transaction) {
    return null;
  }

  const title =
    transaction.note ||
    transaction.category?.name ||
    (transaction.type === 'transfer'
      ? (locale === 'en' ? 'Balance Transfer' : 'Transfer Saldo')
      : (locale === 'en' ? 'Balance Adjustment' : 'Penyesuaian Saldo'));

  const sourceAccount = transaction.wallet?.name || (locale === 'en' ? 'Cash' : 'Kas');
  const targetAccount = transaction.targetWallet?.name;

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      showCloseButton={true}
      maxWidth={380}
      useNativeModal={false}
    >
      <View className="items-center mb-3">
        <View className="w-12 h-12 rounded-2xl bg-status-danger/10 border border-status-danger/25 items-center justify-center mb-2">
          <Trash2 size={22} color="#EF4444" />
        </View>

        <Text className="text-base font-black text-linen-text-primary dark:text-cypress-text-primary text-center">
          {t('history.deleteModalTitle')}
        </Text>
        <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary text-center mt-0.5">
          {t('history.deleteModalDesc')}
        </Text>
      </View>

      <View className="my-2.5 p-3 rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-2.5">
          <View
            className={`w-9 h-9 rounded-xl items-center justify-center mr-2.5 ${
              transaction.type === 'income'
                ? 'bg-status-safe/10 border border-status-safe/25'
                : transaction.type === 'transfer'
                ? 'bg-accent-brass/10 dark:bg-accent-champagne/10 border border-accent-brass/25 dark:border-accent-champagne/25'
                : 'bg-linen-card dark:bg-cypress-card border border-linen-border dark:border-cypress-border'
            }`}
          >
            <CategoryIcon
              categoryId={transaction.categoryId}
              type={transaction.type}
              size={16}
              color={
                transaction.type === 'income'
                  ? '#10B981'
                  : transaction.type === 'transfer'
                  ? colorScheme === 'dark'
                    ? '#D4AF37'
                    : '#B8860B'
                  : colors.text
              }
            />
          </View>

          <View className="flex-1">
            <Text
              className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary"
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text
              className="text-[10px] text-linen-text-secondary dark:text-cypress-text-secondary mt-0.5"
              numberOfLines={1}
            >
              {transaction.type === 'transfer'
                ? `${sourceAccount} → ${targetAccount || (locale === 'en' ? 'Target' : 'Tujuan')}`
                : `${sourceAccount}${transaction.category?.name ? ` • ${transaction.category.name}` : ''}`}
            </Text>
          </View>
        </View>

        <Text
          className={`text-xs font-bold font-mono tabular-nums ${
            transaction.type === 'expense'
              ? 'text-status-danger'
              : transaction.type === 'income'
              ? 'text-status-safe'
              : 'text-linen-text-primary dark:text-cypress-text-primary'
          }`}
        >
          {transaction.type === 'expense'
            ? `-${formatCurrency(transaction.amount, isPrivacyMode)}`
            : transaction.type === 'income'
            ? `+${formatCurrency(transaction.amount, isPrivacyMode)}`
            : formatCurrency(transaction.amount, isPrivacyMode)}
        </Text>
      </View>

      <View className="mb-4 flex-row items-center p-2.5 rounded-xl bg-status-safe/10 border border-status-safe/20">
        <RotateCcw size={14} color="#10B981" />
        <Text className="ml-2 text-[11px] text-status-safe font-medium flex-1 leading-4">
          {t('history.deleteModalWalletRollback', { wallet: sourceAccount })}
        </Text>
      </View>

      <View className="flex-row gap-3">
        <Pressable
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="flex-1 min-h-[44px] py-3 rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border items-center justify-center active:opacity-70"
        >
          <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary">
            {t('history.cancel')}
          </Text>
        </Pressable>

        <Pressable
          onPress={onConfirm}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="flex-1 min-h-[44px] py-3 rounded-2xl bg-status-danger items-center justify-center active:opacity-80 shadow-sm"
        >
          <Text className="text-xs font-bold text-white">
            {t('history.delete')}
          </Text>
        </Pressable>
      </View>
    </AppModal>
  );
}

import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Trash2, RotateCcw, X } from 'lucide-react-native';
import { formatCurrency } from '@/lib/format';
import { TransactionWithDetails } from '@/lib/db';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import Colors from '@/constants/Colors';

export interface DeleteTransactionModalProps {
  visible: boolean;
  transaction: TransactionWithDetails | null;
  isPrivacyMode: boolean;
  colorScheme: 'light' | 'dark';
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Centered dialog for deleting transactions with instant 60-120fps Reanimated physics.
 */
export function DeleteTransactionModal({
  visible,
  transaction,
  isPrivacyMode,
  colorScheme,
  onClose,
  onConfirm,
}: DeleteTransactionModalProps) {
  const colors = Colors[colorScheme];

  const scale = useSharedValue(0.92);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 120 });
      scale.value = withSpring(1, { damping: 50, stiffness: 420 });
    } else {
      opacity.value = 0;
      scale.value = 0.92;
    }
  }, [visible]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!transaction) {
    return null;
  }

  const title =
    transaction.note ||
    transaction.category?.name ||
    (transaction.type === 'transfer' ? 'Transfer Saldo' : 'Penyesuaian Saldo');

  const sourceAccount = transaction.wallet?.name || 'Kas';
  const targetAccount = transaction.targetWallet?.name;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-center items-center px-6">
        <Animated.View
          style={animatedBackdropStyle}
          className="absolute inset-0 bg-black/60"
        >
          <Pressable
            onPress={onClose}
            className="flex-1"
            accessibilityLabel="Tutup dialog"
          />
        </Animated.View>

        <Animated.View
          style={animatedCardStyle}
          className="w-full max-w-sm rounded-3xl bg-linen-card dark:bg-cypress-card border border-linen-border dark:border-cypress-border p-5 shadow-2xl z-10"
        >
          <View className="items-center mb-3 relative">
            <Pressable
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="absolute right-0 top-0 w-8 h-8 rounded-full bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border items-center justify-center active:opacity-70 z-10"
              accessibilityLabel="Tutup"
            >
              <X size={14} color={colors.textSecondary} />
            </Pressable>

            <View className="w-12 h-12 rounded-2xl bg-status-danger/10 border border-status-danger/25 items-center justify-center mb-2">
              <Trash2 size={22} color="#EF4444" />
            </View>

            <Text className="text-base font-black text-linen-text-primary dark:text-cypress-text-primary text-center">
              Hapus Catatan?
            </Text>
            <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary text-center mt-0.5">
              Catatan ini akan dihapus dari riwayat
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
                    ? `${sourceAccount} → ${targetAccount || 'Tujuan'}`
                    : `${sourceAccount}${transaction.category?.name ? ` • ${transaction.category.name}` : ''}`}
                </Text>
              </View>
            </View>

            <Text
              className={`text-xs font-bold font-mono ${
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
              Saldo <Text className="font-bold">{sourceAccount}</Text> otomatis kembali seperti semula.
            </Text>
          </View>

          <View className="flex-row space-x-3">
            <Pressable
              onPress={onClose}
              className="flex-1 py-3 rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border items-center justify-center active:opacity-70"
            >
              <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary">
                Batal
              </Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              className="flex-1 py-3 rounded-2xl bg-status-danger items-center justify-center active:opacity-80 shadow-sm"
            >
              <Text className="text-xs font-bold text-white">
                Hapus
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

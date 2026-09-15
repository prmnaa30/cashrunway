import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
} from 'react-native';
import { SlidersHorizontal } from 'lucide-react-native';
import { Wallet } from '@/lib/db';
import { formatCurrency } from '@/lib/format';
import { AppModal } from '@/components/ui/AppModal';
import { useTranslation } from '@/lib/i18n';
import Colors from '@/constants/Colors';

export interface AdjustBalanceModalProps {
  visible: boolean;
  wallet: Wallet | null;
  isPrivacyMode: boolean;
  colorScheme: 'light' | 'dark';
  onClose: () => void;
  onConfirm: (walletId: string, newBalance: number) => Promise<void>;
}

export function AdjustBalanceModal({
  visible,
  wallet,
  isPrivacyMode,
  colorScheme,
  onClose,
  onConfirm,
}: AdjustBalanceModalProps) {
  const { t, locale } = useTranslation();
  const colors = Colors[colorScheme];

  const [inputBalance, setInputBalance] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (visible && wallet) {
      setInputBalance(wallet.balance.toString());
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [visible, wallet]);

  if (!wallet) return null;

  const currentBalance = wallet.balance || 0;
  const parsedNewBalance = parseFloat(inputBalance.replace(/[^0-9.]/g, '')) || 0;
  const delta = parsedNewBalance - currentBalance;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onConfirm(wallet.id, parsedNewBalance);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || (locale === 'en' ? 'Failed to adjust balance' : 'Gagal memperbarui saldo'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      showCloseButton={true}
      maxWidth={380}
    >
      <View className="items-center mb-3">
        <View className="w-12 h-12 rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border items-center justify-center mb-2">
          <SlidersHorizontal size={20} color={colors.tint} />
        </View>

        <Text className="text-base font-black text-linen-text-primary dark:text-cypress-text-primary text-center">
          {t('wallets.adjustModalTitle')}
        </Text>
        <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary text-center mt-0.5">
          {t('wallets.adjustModalDesc', { wallet: wallet.name })}
        </Text>
      </View>

      <View className="my-3 p-3.5 rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border space-y-2">
        <View className="flex-row justify-between items-center py-0.5">
          <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
            {t('wallets.recordedBalance')}
          </Text>
          <Text className="text-xs font-mono font-bold text-linen-text-primary dark:text-cypress-text-primary tabular-nums">
            {formatCurrency(currentBalance, isPrivacyMode)}
          </Text>
        </View>

        <View className="flex-row justify-between items-center py-0.5">
          <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
            {t('wallets.difference')}
          </Text>
          <Text
            className={`text-xs font-mono font-bold tabular-nums ${
              delta > 0
                ? 'text-status-safe'
                : delta < 0
                ? 'text-status-danger'
                : 'text-linen-text-secondary dark:text-cypress-text-secondary'
            }`}
          >
            {delta > 0 ? `+${formatCurrency(delta, isPrivacyMode)}` : formatCurrency(delta, isPrivacyMode)}
          </Text>
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-xs font-semibold text-linen-text-secondary dark:text-cypress-text-secondary mb-1.5">
          {t('wallets.actualBalance')}
        </Text>
        <TextInput
          value={inputBalance}
          onChangeText={setInputBalance}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={colors.textSecondary}
          className="w-full h-12 px-4 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border text-linen-text-primary dark:text-cypress-text-primary font-mono text-base font-bold"
        />
      </View>

      {errorMsg ? (
        <Text className="text-xs text-status-danger text-center mb-3">
          {errorMsg}
        </Text>
      ) : null}

      <View className="flex-row gap-3">
        <Pressable
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="flex-1 min-h-[44px] py-3 rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border items-center justify-center active:opacity-70"
        >
          <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary">
            {t('wallets.cancel')}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleConfirm}
          disabled={isSubmitting}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="flex-1 min-h-[44px] py-3 rounded-2xl bg-cypress-surface dark:bg-accent-champagne items-center justify-center active:opacity-80 shadow-sm"
        >
          <Text className="text-xs font-bold text-white dark:text-[#0C1513]">
            {t('wallets.saveAdjustment')}
          </Text>
        </Pressable>
      </View>
    </AppModal>
  );
}

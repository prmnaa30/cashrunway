import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
} from 'react-native';
import { Archive } from 'lucide-react-native';
import { Wallet } from '@/lib/db';
import { AppModal } from '@/components/ui/AppModal';
import { useTranslation } from '@/lib/i18n';
import Colors from '@/constants/Colors';

export interface DeleteWalletModalProps {
  visible: boolean;
  wallet: Wallet | null;
  isPrivacyMode: boolean;
  colorScheme: 'light' | 'dark';
  onClose: () => void;
  onConfirm: (walletId: string) => Promise<void>;
}

export function DeleteWalletModal({
  visible,
  wallet,
  isPrivacyMode,
  colorScheme,
  onClose,
  onConfirm,
}: DeleteWalletModalProps) {
  const { t, locale } = useTranslation();
  const colors = Colors[colorScheme];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!wallet) return null;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onConfirm(wallet.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || (locale === 'en' ? 'Failed to delete account' : 'Gagal menghapus dompet'));
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
        <View className="w-12 h-12 rounded-full bg-status-danger/15 border border-status-danger/30 items-center justify-center mb-2">
          <Archive size={22} color="#EF4444" />
        </View>
        <Text className="text-base font-black text-linen-text-primary dark:text-cypress-text-primary text-center">
          {t('wallets.deleteModalTitle')}
        </Text>
        <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary text-center mt-1">
          {t('wallets.deleteModalDesc', { wallet: wallet.name })}
        </Text>
      </View>

      {errorMsg ? (
        <Text className="text-xs text-status-danger text-center mb-3">
          {errorMsg}
        </Text>
      ) : null}

      <View className="flex-row gap-3 mt-2">
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
          className="flex-1 min-h-[44px] py-3 rounded-2xl bg-status-danger items-center justify-center active:opacity-80 shadow-sm"
        >
          <Text className="text-xs font-bold text-white">
            {t('wallets.confirmDelete')}
          </Text>
        </Pressable>
      </View>
    </AppModal>
  );
}

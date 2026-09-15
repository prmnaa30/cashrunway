import React from 'react';
import {
  View,
  Text,
  Pressable,
} from 'react-native';
import { Edit3, SlidersHorizontal, Trash2, Wallet as WalletIcon } from 'lucide-react-native';
import { Wallet } from '@/lib/db';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { useTranslation } from '@/lib/i18n';
import Colors from '@/constants/Colors';

export interface WalletActionMenuModalProps {
  visible: boolean;
  wallet: Wallet | null;
  colorScheme: 'light' | 'dark';
  onClose: () => void;
  onEdit: (wallet: Wallet) => void;
  onAdjustBalance: (wallet: Wallet) => void;
  onDelete: (wallet: Wallet) => void;
}

export function WalletActionMenuModal({
  visible,
  wallet,
  colorScheme,
  onClose,
  onEdit,
  onAdjustBalance,
  onDelete,
}: WalletActionMenuModalProps) {
  const { t, locale } = useTranslation();
  const colors = Colors[colorScheme];

  if (!wallet) return null;

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title={wallet.name}
      subtitle={t('wallets.actionMenuTitle')}
      maxHeight="50%"
    >
      <View className="px-5 pt-3 pb-6 space-y-2.5">
        <Pressable
          onPress={() => {
            onClose();
            setTimeout(() => onEdit(wallet), 150);
          }}
          className="p-3.5 min-h-[48px] rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border flex-row items-center active:opacity-70 mb-2"
        >
          <Edit3 size={16} color={colors.tint} />
          <View className="ml-3 flex-1">
            <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary">
              {t('wallets.actionEditWallet')}
            </Text>
            <Text className="text-[10px] text-linen-text-secondary dark:text-cypress-text-secondary">
              {locale === 'en' ? 'Rename, account type, or interest yield' : 'Ganti nama, bentuk dompet, atau suku bunga'}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => {
            onClose();
            setTimeout(() => onAdjustBalance(wallet), 150);
          }}
          className="p-3.5 min-h-[48px] rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border flex-row items-center active:opacity-70 mb-2"
        >
          <SlidersHorizontal size={16} color={colors.tint} />
          <View className="ml-3 flex-1">
            <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary">
              {t('wallets.actionAdjustBalance')}
            </Text>
            <Text className="text-[10px] text-linen-text-secondary dark:text-cypress-text-secondary">
              {locale === 'en' ? `Reconcile balance in ${wallet.name} with real physical amount` : `Perbarui saldo akun ${wallet.name} agar sesuai dengan jumlah yang sebenarnya`}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => {
            onClose();
            setTimeout(() => onDelete(wallet), 150);
          }}
          className="p-3.5 min-h-[48px] rounded-2xl bg-status-danger/10 border border-status-danger/25 flex-row items-center active:opacity-70"
        >
          <Trash2 size={16} color="#EF4444" />
          <View className="ml-3 flex-1">
            <Text className="text-xs font-bold text-status-danger">
              {t('wallets.actionDeleteWallet')}
            </Text>
            <Text className="text-[10px] text-linen-text-secondary dark:text-cypress-text-secondary">
              {locale === 'en' ? 'Hide account and retain past mutations' : 'Simpan riwayat masa lalu dan sembunyikan dompet'}
            </Text>
          </View>
        </Pressable>
      </View>
    </AppBottomSheet>
  );
}

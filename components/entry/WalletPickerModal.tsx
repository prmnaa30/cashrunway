import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Wallet as WalletIcon, Landmark, Smartphone, Vault, Check } from 'lucide-react-native';
import { Wallet } from '@/lib/db';
import { formatCurrency } from '@/lib/format';
import { AppModal } from '@/components/ui/AppModal';
import Colors from '@/constants/Colors';

export interface WalletPickerModalProps {
  visible: boolean;
  wallets: Wallet[];
  selectedWalletId: string;
  onSelectWallet: (walletId: string) => void;
  onClose: () => void;
  colorScheme: 'light' | 'dark';
  isPrivacyMode?: boolean;
  title?: string;
  excludeWalletId?: string;
}

function getWalletIcon(type: string, isVault: number, size = 18, color?: string) {
  if (isVault) return <Vault size={size} color={color} />;
  switch (type) {
    case 'bank':
      return <Landmark size={size} color={color} />;
    case 'ewallet':
      return <Smartphone size={size} color={color} />;
    default:
      return <WalletIcon size={size} color={color} />;
  }
}

export function WalletPickerModal({
  visible,
  wallets,
  selectedWalletId,
  onSelectWallet,
  onClose,
  colorScheme,
  isPrivacyMode = false,
  title = 'Pilih Dompet',
  excludeWalletId,
}: WalletPickerModalProps) {
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const filteredWallets = useMemo(
    () => (excludeWalletId ? wallets.filter((w) => w.id !== excludeWalletId) : wallets),
    [wallets, excludeWalletId]
  );

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={title}
      maxWidth={380}
    >
      <ScrollView className="max-h-72" showsVerticalScrollIndicator={false}>
        {filteredWallets.map((wallet) => {
          const isSelected = wallet.id === selectedWalletId;
          return (
            <TouchableOpacity
              key={wallet.id}
              onPress={() => {
                onSelectWallet(wallet.id);
                onClose();
              }}
              activeOpacity={0.7}
              className={"flex-row items-center justify-between p-3.5 rounded-2xl mb-2 border " + (
                isSelected
                  ? 'bg-linen-surface dark:bg-cypress-surface border-accent-brass dark:border-accent-champagne'
                  : 'bg-linen-card dark:bg-cypress-card border-linen-border dark:border-cypress-border active:opacity-70'
              )}
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-9 h-9 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border items-center justify-center mr-3">
                  {getWalletIcon(wallet.type, wallet.isVault, 18, isSelected ? (isDark ? '#D4AF37' : '#B8860B') : colors.tint)}
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-linen-text-primary dark:text-cypress-text-primary">
                    {wallet.name}
                  </Text>
                  <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary font-mono mt-0.5">
                    {formatCurrency(wallet.balance, isPrivacyMode)}
                  </Text>
                </View>
              </View>

              {isSelected && (
                <Check size={18} color={isDark ? '#D4AF37' : '#B8860B'} />
              )}
            </TouchableOpacity>
          );
        })}

        {filteredWallets.length === 0 && (
          <View className="py-8 items-center justify-center">
            <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
              Tidak ada dompet yang tersedia
            </Text>
          </View>
        )}
      </ScrollView>
    </AppModal>
  );
}

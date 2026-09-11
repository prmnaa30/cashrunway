import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import { Wallet as WalletIcon, Landmark, Smartphone, Vault, Check, X } from 'lucide-react-native';
import { Wallet } from '@/lib/db';
import { formatCurrency } from '@/lib/format';
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

/**
 * Overlay picker for source or target wallet selection with smooth fade animation.
 */
function WalletPickerModalComponent({
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
  const filteredWallets = useMemo(
    () => (excludeWalletId ? wallets.filter((w) => w.id !== excludeWalletId) : wallets),
    [wallets, excludeWalletId]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center px-5 bg-black/65">
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Tutup"
        />

        <View className="w-full max-w-sm rounded-3xl bg-linen-bg dark:bg-cypress-bg border border-linen-border dark:border-cypress-border p-5 shadow-2xl z-10 max-h-[80%]">
        {/* Header */}
        <View className="flex-row items-center justify-between pb-3 border-b border-linen-border/60 dark:border-cypress-border/60">
          <Text className="text-base font-black text-linen-text-primary dark:text-cypress-text-primary">
            {title}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-7 h-7 rounded-full bg-linen-surface dark:bg-cypress-card border border-linen-border dark:border-cypress-border items-center justify-center"
          >
            <X size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* List of Wallets */}
        <ScrollView
          className="mt-3 max-h-72"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        >
          {filteredWallets.map((wallet) => {
            const isSelected = wallet.id === selectedWalletId;
            const iconColor = isSelected
              ? colorScheme === 'dark'
                ? '#D4AF37'
                : '#059669'
              : colors.textSecondary;

            return (
              <TouchableOpacity
                key={wallet.id}
                activeOpacity={0.75}
                onPress={() => {
                  onSelectWallet(wallet.id);
                  onClose();
                }}
                className={`flex-row items-center justify-between p-3.5 mb-2 rounded-2xl border ${
                  isSelected
                    ? colorScheme === 'dark'
                      ? 'bg-accent-champagne/15 border-accent-champagne'
                      : 'bg-emerald-500/10 border-emerald-600'
                    : 'bg-linen-surface dark:bg-cypress-card border-linen-border/80 dark:border-cypress-border/80'
                }`}
              >
                <View className="flex-row items-center flex-1 mr-3">
                  <View
                    className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
                      isSelected
                        ? colorScheme === 'dark'
                          ? 'bg-accent-champagne/20'
                          : 'bg-emerald-500/20'
                        : 'bg-linen-card dark:bg-cypress-surface'
                    }`}
                  >
                    {getWalletIcon(wallet.type, wallet.isVault, 18, iconColor)}
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-sm ${
                        isSelected
                          ? colorScheme === 'dark'
                            ? 'font-bold text-accent-champagne'
                            : 'font-bold text-emerald-800'
                          : 'font-semibold text-linen-text-primary dark:text-cypress-text-primary'
                      }`}
                      numberOfLines={1}
                    >
                      {wallet.name}
                    </Text>
                    <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary font-mono mt-0.5">
                      {formatCurrency(wallet.balance, isPrivacyMode)}
                    </Text>
                  </View>
                </View>

                {isSelected && (
                  <View
                    className={`w-6 h-6 rounded-full items-center justify-center ${
                      colorScheme === 'dark'
                        ? 'bg-accent-champagne'
                        : 'bg-emerald-600'
                    }`}
                  >
                    <Check
                      size={14}
                      color={colorScheme === 'dark' ? '#0C1513' : '#FFFFFF'}
                      strokeWidth={3}
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  </Modal>
);
}

export const WalletPickerModal = React.memo(WalletPickerModalComponent);

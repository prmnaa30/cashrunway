import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Wallet as WalletIcon, Landmark, Smartphone, Vault, ArrowRight } from 'lucide-react-native';
import { Wallet } from '@/lib/db';
import { TransactionMode } from './types';
import { formatCurrency } from '@/lib/format';
import Colors from '@/constants/Colors';

export interface WalletPickerProps {
  wallets: Wallet[];
  selectedWalletId: string;
  onSelectWallet: (walletId: string) => void;
  mode: TransactionMode;
  targetWalletId?: string;
  onSelectTargetWallet?: (walletId: string) => void;
  colorScheme: 'light' | 'dark';
  isPrivacyMode?: boolean;
}

function getWalletIcon(type: string, isVault: number, size = 13, color?: string) {
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
 * Wallet selector for Quick Entry.
 * In Transfer mode, displays both source and target wallet pickers.
 */
export function WalletPicker({
  wallets,
  selectedWalletId,
  onSelectWallet,
  mode,
  targetWalletId,
  onSelectTargetWallet,
  colorScheme,
  isPrivacyMode = false,
}: WalletPickerProps) {
  const colors = Colors[colorScheme];

  const renderWalletPills = (
    currentId: string,
    onSelect: (id: string) => void,
    excludeId?: string
  ) => {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        className="flex-row py-1"
      >
        {wallets.map((wallet) => {
          const isSelected = wallet.id === currentId;
          const isExcluded = wallet.id === excludeId;

          let bgClass =
            'bg-linen-surface dark:bg-cypress-card border-linen-border/90 dark:border-cypress-border/90';
          let textClass =
            'text-linen-text-secondary dark:text-cypress-text-secondary';
          let iconColor = colors.textSecondary;

          if (isSelected) {
            bgClass =
              colorScheme === 'dark'
                ? 'bg-accent-champagne/15 border-accent-champagne'
                : 'bg-accent-brass/15 border-accent-brass';
            textClass =
              colorScheme === 'dark'
                ? 'text-accent-champagne font-bold'
                : 'text-accent-brass font-bold';
            iconColor = colorScheme === 'dark' ? '#D4AF37' : '#B8860B';
          } else if (isExcluded) {
            bgClass = 'opacity-30 border-dashed border-linen-border dark:border-cypress-border';
          }

          return (
            <Pressable
              key={wallet.id}
              disabled={isExcluded}
              onPress={() => onSelect(wallet.id)}
              className={`flex-row items-center px-3 py-2 mr-2 rounded-xl border ${bgClass}`}
            >
              <View className="mr-1.5">
                {getWalletIcon(wallet.type, wallet.isVault, 13, iconColor)}
              </View>
              <View>
                <Text className={`text-xs ${textClass}`}>{wallet.name}</Text>
                <Text className="text-[10px] text-linen-text-secondary/80 dark:text-cypress-text-secondary/80 font-mono">
                  {formatCurrency(wallet.balance, isPrivacyMode)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    );
  };

  if (mode === 'transfer') {
    const isSameWallet = selectedWalletId === targetWalletId;

    return (
      <View className="mb-2">
        {/* Source Wallet */}
        <View className="px-4 mb-1 flex-row items-center justify-between">
          <Text className="text-[11px] font-bold text-linen-text-secondary dark:text-cypress-text-secondary uppercase tracking-wider">
            Dari Dompet
          </Text>
        </View>
        {renderWalletPills(selectedWalletId, onSelectWallet)}

        {/* Target Wallet */}
        <View className="px-4 mt-2 mb-1 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <ArrowRight size={11} color={colors.textSecondary} className="mr-1" />
            <Text className="text-[11px] font-bold text-linen-text-secondary dark:text-cypress-text-secondary uppercase tracking-wider ml-1">
              Ke Dompet
            </Text>
          </View>
          {isSameWallet && (
            <Text className="text-[10px] font-bold text-status-danger">
              Pilih dompet yang berbeda
            </Text>
          )}
        </View>
        {onSelectTargetWallet &&
          renderWalletPills(targetWalletId ?? '', onSelectTargetWallet, selectedWalletId)}
      </View>
    );
  }

  return (
    <View className="mb-2">
      <View className="px-4 mb-1">
        <Text className="text-[11px] font-bold text-linen-text-secondary dark:text-cypress-text-secondary uppercase tracking-wider">
          {mode === 'expense' ? 'Sumber Pembayaran' : 'Disimpan ke'}
        </Text>
      </View>
      {renderWalletPills(selectedWalletId, onSelectWallet)}
    </View>
  );
}

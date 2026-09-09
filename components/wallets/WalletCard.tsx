import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Landmark, Banknote, Smartphone, MoreVertical } from 'lucide-react-native';
import { formatCurrency } from '@/lib/format';
import { Wallet } from '@/lib/db';
import Colors from '@/constants/Colors';

interface WalletCardProps {
  wallet: Wallet;
  totalOperationalBalance: number;
  isPrivacyMode: boolean;
  colorScheme: 'light' | 'dark';
  onOpenOptions?: (wallet: Wallet) => void;
}

export function WalletCard({
  wallet,
  totalOperationalBalance,
  isPrivacyMode,
  colorScheme,
  onOpenOptions,
}: WalletCardProps) {
  const colors = Colors[colorScheme];

  const share =
    totalOperationalBalance > 0
      ? Math.round((wallet.balance / totalOperationalBalance) * 100)
      : 0;

  const getWalletIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return <Landmark size={18} color={colors.text} />;
      case 'ewallet':
        return <Smartphone size={18} color={colors.text} />;
      default:
        return <Banknote size={18} color={colors.text} />;
    }
  };

  const getWalletCategoryLabel = (type: string) => {
    switch (type) {
      case 'bank':
        return 'Rekening Bank';
      case 'ewallet':
        return 'Dompet Digital';
      default:
        return 'Uang Tunai';
    }
  };

  return (
    <View className="p-4 rounded-2xl bg-linen-card dark:bg-cypress-card border border-linen-border dark:border-cypress-border mb-3 flex-row items-center justify-between">
      <View className="flex-row items-center flex-1 mr-3">
        <View className="w-10 h-10 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border items-center justify-center mr-3">
          {getWalletIcon(wallet.type)}
        </View>

        <View className="flex-1">
          <Text
            numberOfLines={1}
            className="text-sm font-bold text-linen-text-primary dark:text-cypress-text-primary"
          >
            {wallet.name}
          </Text>
          <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary mt-0.5">
            {getWalletCategoryLabel(wallet.type)} • {share}% dari uang harian
          </Text>
        </View>
      </View>

      <View className="flex-row items-center">
        <Text className="text-sm font-bold font-mono text-linen-text-primary dark:text-cypress-text-primary mr-2">
          {formatCurrency(wallet.balance, isPrivacyMode)}
        </Text>

        {onOpenOptions && (
          <Pressable
            onPress={() => onOpenOptions(wallet)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-8 h-8 rounded-lg items-center justify-center active:opacity-60"
            accessibilityLabel={`Opsi ${wallet.name}`}
          >
            <MoreVertical size={16} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

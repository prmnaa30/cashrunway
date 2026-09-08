import React from 'react';
import { View, Text } from 'react-native';
import { Landmark, Banknote, Smartphone } from 'lucide-react-native';
import { formatCurrency } from '@/lib/format';
import { Wallet } from '@/lib/db';
import Colors from '@/constants/Colors';

interface WalletCardProps {
  wallet: Wallet;
  totalOperationalBalance: number;
  isPrivacyMode: boolean;
  colorScheme: 'light' | 'dark';
}

export function WalletCard({
  wallet,
  totalOperationalBalance,
  isPrivacyMode,
  colorScheme,
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
          <Text className="text-sm font-bold text-linen-text-primary dark:text-cypress-text-primary">
            {wallet.name}
          </Text>
          <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary mt-0.5">
            {getWalletCategoryLabel(wallet.type)} • {share}% dari uang harian
          </Text>
        </View>
      </View>

      <View className="items-end">
        <Text className="text-sm font-bold font-mono text-linen-text-primary dark:text-cypress-text-primary">
          {formatCurrency(wallet.balance, isPrivacyMode)}
        </Text>
      </View>
    </View>
  );
}

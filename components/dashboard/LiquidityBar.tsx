import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { PieChart } from 'lucide-react-native';
import { formatCurrency } from '@/lib/format';
import Colors from '@/constants/Colors';

interface LiquidityBarProps {
  totalBalance: number;
  operationalBalance: number;
  isPrivacyMode: boolean;
  colorScheme: 'light' | 'dark';
}

export function LiquidityBar({
  totalBalance,
  operationalBalance,
  isPrivacyMode,
  colorScheme,
}: LiquidityBarProps) {
  const colors = Colors[colorScheme];

  const operationalRatio = useMemo(() => {
    if (totalBalance <= 0) return 50;
    return Math.round((operationalBalance / totalBalance) * 100);
  }, [operationalBalance, totalBalance]);

  const operationalColor = '#10B981';
  const vaultColor = colorScheme === 'dark' ? '#D4AF37' : '#B8860B';

  return (
    <View className="rounded-3xl bg-linen-card dark:bg-cypress-card border border-linen-border dark:border-cypress-border p-4">
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-row items-center">
          <PieChart size={15} color={colors.tint} />
          <Text className="ml-1.5 text-xs font-bold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary">
            Pembagian Uangmu
          </Text>
        </View>
        <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary">
          Total {formatCurrency(totalBalance, isPrivacyMode)}
        </Text>
      </View>

      <View className="h-2.5 w-full flex-row rounded-full overflow-hidden bg-linen-surface dark:bg-cypress-surface mb-2.5">
        <View
          style={{
            width: `${operationalRatio}%`,
            backgroundColor: operationalColor,
          }}
        />
        <View
          style={{
            width: `${100 - operationalRatio}%`,
            backgroundColor: vaultColor,
          }}
        />
      </View>

      <View className="flex-row justify-between">
        <View className="flex-row items-center">
          <View
            className="w-2.5 h-2.5 rounded-sm mr-1.5"
            style={{ backgroundColor: operationalColor }}
          />
          <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
            Uang Harian ({operationalRatio}%)
          </Text>
        </View>

        <View className="flex-row items-center">
          <View
            className="w-2.5 h-2.5 rounded-sm mr-1.5"
            style={{ backgroundColor: vaultColor }}
          />
          <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
            Tabungan ({100 - operationalRatio}%)
          </Text>
        </View>
      </View>
    </View>
  );
}

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { formatCurrency } from '@/lib/format';
import { VaultYieldStats } from '@/store/useFinanceStore';
import Colors from '@/constants/Colors';

interface VaultYieldCardProps {
  vaultStats: VaultYieldStats;
  isPrivacyMode: boolean;
  colorScheme: 'light' | 'dark';
  onAccrue: () => void;
}

export function VaultYieldCard({
  vaultStats,
  isPrivacyMode,
  colorScheme,
  onAccrue,
}: VaultYieldCardProps) {
  const colors = Colors[colorScheme];

  return (
    <View className="rounded-3xl bg-linen-card dark:bg-cypress-card border border-accent-brass/30 dark:border-accent-champagne/30 p-5 mb-4">
      <View className="flex-row items-center justify-between pb-3 border-b border-linen-border/60 dark:border-cypress-border/60 mb-3">
        <View className="flex-row items-center">
          <Sparkles size={16} color={colors.tint} />
          <Text className="ml-1.5 text-xs font-bold uppercase tracking-wider text-accent-brass dark:text-accent-champagne">
            Bunga Tabungan
          </Text>
        </View>

        <View className="px-2 py-0.5 rounded bg-accent-brass/15 dark:bg-accent-champagne/15 border border-accent-brass/30 dark:border-accent-champagne/30">
          <Text className="text-[10px] font-bold text-accent-brass dark:text-accent-champagne font-mono">
            3.75% per tahun
          </Text>
        </View>
      </View>

      <View className="my-1">
        <View className="flex-row items-baseline">
          <Text className="text-4xl font-black tracking-tight text-status-safe">
            +{formatCurrency(vaultStats.estimatedDailyNet, isPrivacyMode)}
          </Text>
          <Text className="ml-1.5 text-xs font-semibold text-linen-text-secondary dark:text-cypress-text-secondary">
            /hari
          </Text>
        </View>
        <Text className="mt-1 text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
          Perkiraan bunga bersih yang didapat tiap hari (sudah dipotong pajak)
        </Text>
      </View>

      <View className="mt-4 pt-3 border-t border-linen-border/60 dark:border-cypress-border/60 flex-row justify-between">
        <View>
          <Text className="text-[10px] uppercase font-semibold text-linen-text-secondary dark:text-cypress-text-secondary tracking-wider">
            Perkiraan 1 Bulan
          </Text>
          <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary mt-0.5">
            +{formatCurrency(vaultStats.projectedMonthlyYield, isPrivacyMode)}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-[10px] uppercase font-semibold text-linen-text-secondary dark:text-cypress-text-secondary tracking-wider">
            Perkiraan 1 Tahun
          </Text>
          <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary mt-0.5">
            +{formatCurrency(vaultStats.projectedAnnualYield, isPrivacyMode)}
          </Text>
        </View>
      </View>

      {vaultStats.totalPendingInterest > 0 && (
        <View className="mt-4 pt-3 border-t border-linen-border/60 dark:border-cypress-border/60">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
              Bunga yang belum diambil:{' '}
              <Text className="font-bold text-status-safe">
                +{formatCurrency(vaultStats.totalPendingInterest, isPrivacyMode)}
              </Text>
            </Text>
          </View>
          <Pressable
            onPress={onAccrue}
            className="py-2.5 px-4 rounded-xl bg-accent-brass dark:bg-accent-champagne items-center justify-center active:opacity-80"
          >
            <Text className="text-xs font-bold text-[#0C1513]">
              Ambil Bunga Tabungan Sekarang
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

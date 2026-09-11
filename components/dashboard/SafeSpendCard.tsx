import React, { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { Shield, ChevronDown, Calculator } from 'lucide-react-native';
import { formatCurrency } from '@/lib/format';
import { SafeSpendResult } from '@/lib/engine';
import Colors from '@/constants/Colors';

interface SafeSpendCardProps {
  safeSpend: SafeSpendResult;
  operationalBalance?: number;
  isPrivacyMode: boolean;
  colorScheme: 'light' | 'dark';
}

export function SafeSpendCard({
  safeSpend,
  operationalBalance = 0,
  isPrivacyMode,
  colorScheme,
}: SafeSpendCardProps) {
  const colors = Colors[colorScheme];
  const [isExpanded, setIsExpanded] = useState(false);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: withTiming(isExpanded ? '180deg' : '0deg', { duration: 220 }),
      },
    ],
  }));

  const spendPercent = useMemo(() => {
    if (safeSpend.baseDailyAllowance <= 0) return safeSpend.todaySpent > 0 ? 100 : 0;
    return Math.min(
      100,
      Math.round((safeSpend.todaySpent / safeSpend.baseDailyAllowance) * 100)
    );
  }, [safeSpend]);

  const availableCash = Math.max(0, operationalBalance - safeSpend.unpaidBillsTotal);

  return (
    <Pressable
      onPress={() => setIsExpanded((prev) => !prev)}
      accessibilityRole="button"
      accessibilityLabel="Buka atau tutup rincian hitungan batas aman belanja"
      className="rounded-3xl bg-linen-card dark:bg-cypress-card border border-linen-border dark:border-cypress-border p-5 mb-4 overflow-hidden"
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1 pr-2">
          <Shield size={16} color={colors.tint} />
          <Text className="ml-1.5 text-xs font-bold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary">
            Batas Aman Belanja Hari Ini
          </Text>
        </View>

        <View className="flex-row items-center space-x-2">
          <View
            className={`px-2 py-0.5 rounded-full ${
              safeSpend.isOverspent ? 'bg-status-danger/15' : 'bg-status-safe/15'
            }`}
          >
            <Text
              className={`text-[11px] font-bold ${
                safeSpend.isOverspent ? 'text-status-danger' : 'text-status-safe'
              }`}
            >
              {safeSpend.isOverspent ? 'Kelewatan' : 'Masih Aman'}
            </Text>
          </View>
          <Animated.View
            style={chevronStyle}
            className="ml-1 p-0.5 rounded-full bg-linen-surface dark:bg-cypress-surface"
          >
            <ChevronDown size={14} color={colors.textSecondary} />
          </Animated.View>
        </View>
      </View>

      <View className="my-2">
        <Text
          className={`text-3xl font-black tracking-tight ${
            safeSpend.isOverspent
              ? 'text-status-danger'
              : 'text-linen-text-primary dark:text-cypress-text-primary'
          }`}
        >
          {formatCurrency(safeSpend.remainingDailyAllowance, isPrivacyMode)}
        </Text>
        <Text className="mt-0.5 text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
          {safeSpend.isOverspent
            ? 'Pengeluaran hari ini sudah melebihi batas yang disarankan'
            : 'Sisa uang yang aman kamu jajanin sampai nanti malam'}
        </Text>
      </View>

      <View className="mt-3 mb-2">
        <View className="h-1.5 w-full bg-linen-border/70 dark:bg-cypress-surface rounded-full overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${spendPercent}%`,
              backgroundColor: safeSpend.isOverspent ? '#EF4444' : colorScheme === 'dark' ? colors.tint : '#10B981',
            }}
          />
        </View>
        <View className="flex-row justify-between mt-1">
          <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary">
            Sudah keluar: {formatCurrency(safeSpend.todaySpent, isPrivacyMode)}
          </Text>
          <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary">
            Jatah: {formatCurrency(safeSpend.baseDailyAllowance, isPrivacyMode)}
          </Text>
        </View>
      </View>

      <View className="mt-3 pt-3 border-t border-linen-border/60 dark:border-cypress-border/60 flex-row justify-between">
        <View>
          <Text className="text-[10px] uppercase font-semibold text-linen-text-secondary dark:text-cypress-text-secondary tracking-wider">
            Alokasi Tagihan Rutin
          </Text>
          <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary mt-0.5">
            {formatCurrency(safeSpend.unpaidBillsTotal, isPrivacyMode)}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-[10px] uppercase font-semibold text-linen-text-secondary dark:text-cypress-text-secondary tracking-wider">
            Menuju Gajian
          </Text>
          <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary mt-0.5">
            {safeSpend.daysRemaining} hari lagi
          </Text>
        </View>
      </View>

      {/* Expandable Stepped Calculation Breakdown */}
      {isExpanded && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={LinearTransition.duration(200)}
          className="mt-4 pt-3.5 border-t border-dashed border-linen-border dark:border-cypress-border/80"
        >
          <View className="flex-row items-center mb-3">
            <Calculator size={14} color={colors.tint} />
            <Text className="ml-1.5 text-[11px] font-bold uppercase tracking-wider text-linen-text-primary dark:text-cypress-text-primary">
              Rincian Perhitungan Bertingkat
            </Text>
          </View>

          <View className="bg-linen-surface/80 dark:bg-cypress-surface/60 rounded-2xl p-3 border border-linen-border/70 dark:border-cypress-border/50">
            {/* Row 1: Operational Balance */}
            <View className="flex-row justify-between items-center py-1">
              <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
                Saldo Kas Operasional
              </Text>
              <Text className="text-xs font-mono font-bold text-linen-text-primary dark:text-cypress-text-primary">
                {formatCurrency(operationalBalance, isPrivacyMode)}
              </Text>
            </View>

            {/* Row 2: Unpaid Bills */}
            <View className="flex-row justify-between items-center py-1">
              <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
                Tagihan Jatuh Tempo
              </Text>
              <Text className="text-xs font-mono font-semibold text-status-danger">
                - {formatCurrency(safeSpend.unpaidBillsTotal, isPrivacyMode)}
              </Text>
            </View>

            <View className="h-[1px] bg-linen-border/80 dark:border-cypress-border/60 my-1" />

            {/* Row 3: Available Cash */}
            <View className="flex-row justify-between items-center py-1">
              <Text className="text-xs font-medium text-linen-text-primary dark:text-cypress-text-primary">
                Kas Tersedia Belanja
              </Text>
              <Text className="text-xs font-mono font-bold text-linen-text-primary dark:text-cypress-text-primary">
                {formatCurrency(availableCash, isPrivacyMode)}
              </Text>
            </View>

            {/* Row 4: Divided by Remaining Days */}
            <View className="flex-row justify-between items-center py-1">
              <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
                Hari Menuju Gajian
              </Text>
              <Text className="text-xs font-mono font-semibold text-linen-text-secondary dark:text-cypress-text-secondary">
                ÷ {safeSpend.daysRemaining} hari
              </Text>
            </View>

            <View className="h-[1px] bg-linen-border/80 dark:border-cypress-border/60 my-1" />

            {/* Row 5: Base Daily Allowance */}
            <View className="flex-row justify-between items-center py-1">
              <Text className="text-xs font-medium text-linen-text-primary dark:text-cypress-text-primary">
                Jatah Dasar Harian
              </Text>
              <Text className="text-xs font-mono font-bold text-accent-brass dark:text-accent-champagne">
                {formatCurrency(safeSpend.baseDailyAllowance, isPrivacyMode)}
              </Text>
            </View>

            {/* Row 6: Today's Expense */}
            <View className="flex-row justify-between items-center py-1">
              <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
                Belanja Hari Ini
              </Text>
              <Text className="text-xs font-mono font-semibold text-status-danger">
                - {formatCurrency(safeSpend.todaySpent, isPrivacyMode)}
              </Text>
            </View>

            <View className="h-[1px] bg-linen-border/80 dark:border-cypress-border/60 my-1" />

            {/* Row 7: Remaining Safe Spend */}
            <View className="flex-row justify-between items-center pt-1.5 pb-0.5">
              <Text className="text-xs font-black text-linen-text-primary dark:text-cypress-text-primary">
                Sisa Batas Aman Hari Ini
              </Text>
              <Text
                className={`text-xs font-mono font-black ${
                  safeSpend.isOverspent ? 'text-status-danger' : 'text-status-safe'
                }`}
              >
                = {formatCurrency(safeSpend.remainingDailyAllowance, isPrivacyMode)}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}

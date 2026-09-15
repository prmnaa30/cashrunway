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
import { useTranslation } from '@/lib/i18n';
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
  const { t, locale } = useTranslation();
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

  const statusLabel = safeSpend.isOverspent
    ? t('dashboard.safeStatusDanger')
    : safeSpend.remainingDailyAllowance < safeSpend.baseDailyAllowance * 0.2
    ? t('dashboard.safeStatusWarning')
    : t('dashboard.safeStatusSafe');

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
            {t('dashboard.safeSpendTitle')}
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
              {statusLabel}
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
          className={`text-3xl font-black tracking-tight tabular-nums ${
            safeSpend.isOverspent
              ? 'text-status-danger'
              : 'text-linen-text-primary dark:text-cypress-text-primary'
          }`}
        >
          {formatCurrency(safeSpend.remainingDailyAllowance, isPrivacyMode)}
        </Text>
        <Text className="mt-0.5 text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
          {safeSpend.isOverspent
            ? (locale === 'en' ? 'Today spending exceeded recommended limit' : 'Pengeluaran hari ini sudah melebihi batas yang disarankan')
            : t('dashboard.safeSpendSubtitle')}
        </Text>
      </View>

      <View className="mt-3 mb-2">
        <View className="h-2 w-full bg-linen-surface dark:bg-cypress-surface rounded-full overflow-hidden">
          <View
            className={`h-full rounded-full ${
              safeSpend.isOverspent
                ? 'bg-status-danger'
                : spendPercent > 80
                ? 'bg-amber-500'
                : 'bg-status-safe'
            }`}
            style={{ width: `${spendPercent}%` }}
          />
        </View>
        <View className="flex-row justify-between mt-1.5">
          <Text className="text-[10px] text-linen-text-secondary dark:text-cypress-text-secondary">
            {t('dashboard.spentToday', { amount: formatCurrency(safeSpend.todaySpent, isPrivacyMode) })}
          </Text>
          <Text className="text-[10px] text-linen-text-secondary dark:text-cypress-text-secondary">
            {t('dashboard.dailyAllowance', { amount: formatCurrency(safeSpend.baseDailyAllowance, isPrivacyMode) })}
          </Text>
        </View>
      </View>

      <View className="mt-3 pt-3 border-t border-linen-border/60 dark:border-cypress-border/60 flex-row">
        <View className="flex-1 pr-2">
          <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary uppercase tracking-wider font-semibold">
            {t('dashboard.recurringBillsAllocation')}
          </Text>
          <Text className="text-sm font-black text-linen-text-primary dark:text-cypress-text-primary mt-0.5 tabular-nums">
            {formatCurrency(safeSpend.unpaidBillsTotal, isPrivacyMode)}
          </Text>
        </View>

        <View className="w-[1px] bg-linen-border dark:bg-cypress-border mx-2" />

        <View className="flex-1 pl-2">
          <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary uppercase tracking-wider font-semibold">
            {t('dashboard.daysToPayday')}
          </Text>
          <Text className="text-sm font-black text-linen-text-primary dark:text-cypress-text-primary mt-0.5">
            {t('dashboard.daysRemaining', { days: safeSpend.daysRemaining })}
          </Text>
        </View>
      </View>

      {/* Expandable Safe Spend Math Breakdown */}
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
              {locale === 'en' ? 'SAFE SPEND FORMULA' : 'RUMUS BATAS AMAN HARIAN'}
            </Text>
          </View>

          <View className="bg-linen-surface/80 dark:bg-cypress-surface/60 rounded-2xl p-3 border border-linen-border/70 dark:border-cypress-border/50">
            <View className="flex-row justify-between items-center py-1">
              <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
                {locale === 'en' ? 'Active Cash Balance' : 'Saldo Kas Operasional'}
              </Text>
              <Text className="text-xs font-mono font-bold text-linen-text-primary dark:text-cypress-text-primary tabular-nums">
                {formatCurrency(operationalBalance, isPrivacyMode)}
              </Text>
            </View>

            <View className="flex-row justify-between items-center py-1">
              <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
                {locale === 'en' ? 'Unpaid Bills till Payday' : 'Tagihan Belum Lunas s/d Target'}
              </Text>
              <Text className="text-xs font-mono font-semibold text-status-danger tabular-nums">
                - {formatCurrency(safeSpend.unpaidBillsTotal, isPrivacyMode)}
              </Text>
            </View>

            <View className="h-[1px] bg-linen-border/80 dark:border-cypress-border/60 my-1" />

            <View className="flex-row justify-between items-center py-1">
              <Text className="text-xs font-medium text-linen-text-primary dark:text-cypress-text-primary">
                {locale === 'en' ? 'Net Spendable Fund' : 'Sisa Kas Siap Belanja'}
              </Text>
              <Text className="text-xs font-mono font-bold text-linen-text-primary dark:text-cypress-text-primary tabular-nums">
                = {formatCurrency(availableCash, isPrivacyMode)}
              </Text>
            </View>

            <View className="flex-row justify-between items-center py-1">
              <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
                {locale === 'en' ? 'Divided by Days till Payday' : 'Dibagi Hari Tersisa Menuju Target'}
              </Text>
              <Text className="text-xs font-mono font-semibold text-linen-text-secondary dark:text-cypress-text-secondary tabular-nums">
                ÷ {safeSpend.daysRemaining} {t('dashboard.days').toLowerCase()}
              </Text>
            </View>

            <View className="h-[1px] bg-linen-border/80 dark:border-cypress-border/60 my-1" />

            <View className="flex-row justify-between items-center pt-1.5 pb-0.5">
              <Text className="text-xs font-black text-linen-text-primary dark:text-cypress-text-primary">
                {locale === 'en' ? 'Daily Allowance' : 'Jatah Belanja Murni Harian'}
              </Text>
              <Text className="text-xs font-mono font-black text-accent-brass dark:text-accent-champagne tabular-nums">
                = {formatCurrency(safeSpend.baseDailyAllowance, isPrivacyMode)}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}

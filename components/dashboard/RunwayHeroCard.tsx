import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { Compass, ChevronDown, Calculator } from 'lucide-react-native';
import { formatCurrency, formatDate } from '@/lib/format';
import { RunwayResult, BurnRateResult } from '@/lib/engine';
import { useTranslation } from '@/lib/i18n';
import { AppSegmentedTabs } from '@/components/ui/AppSegmentedTabs';
import Colors from '@/constants/Colors';

interface RunwayHeroCardProps {
  runway: RunwayResult;
  burnRate: BurnRateResult;
  operationalBalance: number;
  totalBalance?: number;
  isPrivacyMode: boolean;
  statusColor: string;
  colorScheme: 'light' | 'dark';
  defaultMode?: 'operational' | 'total';
}

export function RunwayHeroCard({
  runway,
  burnRate,
  operationalBalance,
  totalBalance = operationalBalance,
  isPrivacyMode,
  statusColor,
  colorScheme,
  defaultMode = 'operational',
}: RunwayHeroCardProps) {
  const { t, locale } = useTranslation();
  const colors = Colors[colorScheme];
  const [runwayMode, setRunwayMode] = useState<'operational' | 'total'>(defaultMode);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setRunwayMode(defaultMode);
  }, [defaultMode]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: withTiming(isExpanded ? '180deg' : '0deg', { duration: 220 }),
      },
    ],
  }));

  const activeDays =
    runwayMode === 'operational'
      ? runway.operationalRunwayDays
      : runway.emergencyRunwayDays;

  const activeProjectedDate =
    runwayMode === 'operational'
      ? runway.operationalProjectedDate
      : runway.emergencyProjectedDate;

  const activeBalance =
    runwayMode === 'operational' ? operationalBalance : totalBalance;

  const estimatedDaysRatio =
    burnRate.dailyBurnRate > 0
      ? Math.round(activeBalance / burnRate.dailyBurnRate)
      : runway.isInfinite
      ? '∞'
      : 0;

  return (
    <Pressable
      onPress={() => setIsExpanded((prev) => !prev)}
      accessibilityRole="button"
      accessibilityLabel="Buka atau tutup rincian hitungan ketahanan kas"
      className="rounded-3xl bg-linen-card dark:bg-cypress-card border border-linen-border dark:border-cypress-border p-5 mb-4 overflow-hidden"
    >
      <View className="flex-row items-center justify-between pb-3 border-b border-linen-border/60 dark:border-cypress-border/60 mb-4">
        <View className="flex-row items-center">
          <Compass size={16} color={colors.tint} />
          <Text className="ml-1.5 text-xs font-bold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary">
            {t('dashboard.runwayTitle')}
          </Text>
          <Animated.View
            style={chevronStyle}
            className="ml-1.5 p-0.5 rounded-full bg-linen-surface dark:bg-cypress-surface"
          >
            <ChevronDown size={12} color={colors.textSecondary} />
          </Animated.View>
        </View>

        <View style={{ width: 180 }}>
          <AppSegmentedTabs<'operational' | 'total'>
            size="sm"
            value={runwayMode}
            onChange={(val) => setRunwayMode(val)}
            options={[
              { key: 'operational', label: t('dashboard.operationalRunway') },
              { key: 'total', label: t('dashboard.totalRunway') },
            ]}
          />
        </View>
      </View>

      <View className="my-2">
        <View className="flex-row items-baseline">
          <Text className="text-6xl font-black tracking-tight text-linen-text-primary dark:text-cypress-text-primary tabular-nums">
            {runway.isInfinite ? '∞' : runway.isDepleted ? '0' : activeDays}
          </Text>
          {!runway.isInfinite && (
            <Text className="ml-2 text-lg font-bold uppercase tracking-widest text-linen-text-secondary dark:text-cypress-text-secondary">
              {t('dashboard.days')}
            </Text>
          )}
        </View>

        <Text className="mt-1 text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
          {runway.isInfinite ? (
            locale === 'en' ? 'Expenses $0, funds are safe' : 'Pengeluaran Rp 0, uangmu sangat aman'
          ) : runway.isDepleted ? (
            t('dashboard.balanceDepleted')
          ) : activeProjectedDate ? (
            <>
              {locale === 'en' ? 'Safe through ' : 'Diperkirakan cukup sampai '}
              <Text className="font-bold text-linen-text-primary dark:text-cypress-text-primary">
                {formatDate(activeProjectedDate, locale === 'en' ? 'en-US' : 'id-ID')}
              </Text>
            </>
          ) : (
            locale === 'en' ? 'Stable condition' : 'Kondisi keuangan stabil'
          )}
        </Text>
      </View>

      <View className="mt-4 mb-2">
        <View className="flex-row space-x-1.5 h-2">
          {[1, 2, 3, 4, 5].map((seg) => {
            const isFilled =
              runway.isInfinite ||
              (seg === 1 && activeDays > 0) ||
              (seg === 2 && activeDays >= 7) ||
              (seg === 3 && activeDays >= 14) ||
              (seg === 4 && activeDays >= 30) ||
              (seg === 5 && activeDays >= 60);

            return (
              <View
                key={seg}
                className="flex-1 rounded-sm"
                style={{
                  backgroundColor: isFilled
                    ? statusColor
                    : colorScheme === 'dark'
                    ? '#233A34'
                    : '#D0DDD7',
                  opacity: isFilled ? 1 : 0.4,
                }}
              />
            );
          })}
        </View>

        <View className="flex-row justify-between mt-1.5">
          <Text className="text-[10px] text-linen-text-secondary/70 dark:text-cypress-text-secondary/70 font-mono">
            0 {locale === 'en' ? 'd' : 'hr'}
          </Text>
          <Text className="text-[10px] text-linen-text-secondary/70 dark:text-cypress-text-secondary/70 font-mono">
            7 {locale === 'en' ? 'd' : 'hr'}
          </Text>
          <Text className="text-[10px] text-linen-text-secondary/70 dark:text-cypress-text-secondary/70 font-mono">
            14 {locale === 'en' ? 'd' : 'hr'}
          </Text>
          <Text className="text-[10px] text-linen-text-secondary/70 dark:text-cypress-text-secondary/70 font-mono">
            30 {locale === 'en' ? 'd' : 'hr'}
          </Text>
          <Text className="text-[10px] text-linen-text-secondary/70 dark:text-cypress-text-secondary/70 font-mono">
            60+ {locale === 'en' ? 'd' : 'hr'}
          </Text>
        </View>
      </View>

      <View className="mt-3 pt-3 border-t border-linen-border/60 dark:border-cypress-border/60 flex-row">
        <View className="flex-1 pr-2">
          <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary uppercase tracking-wider font-semibold">
            {runwayMode === 'operational'
              ? t('dashboard.operationalRunway')
              : `${t('dashboard.total') || 'Total'} (${t('dashboard.totalRunway')})`}
          </Text>
          <Text className="text-sm font-black text-linen-text-primary dark:text-cypress-text-primary mt-0.5 tabular-nums">
            {formatCurrency(activeBalance, isPrivacyMode)}
          </Text>
        </View>

        <View className="w-[1px] bg-linen-border dark:bg-cypress-border mx-2" />

        <View className="flex-1 pl-2">
          <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary uppercase tracking-wider font-semibold">
            {t('dashboard.avgDailySpend')}
          </Text>
          <Text className="text-sm font-black text-linen-text-primary dark:text-cypress-text-primary mt-0.5 tabular-nums">
            {formatCurrency(burnRate.dailyBurnRate, isPrivacyMode)}
            <Text className="text-xs font-normal text-linen-text-secondary dark:text-cypress-text-secondary">
              {t('dashboard.perDay')}
            </Text>
          </Text>
        </View>
      </View>

      {/* Expandable Calculation Breakdown */}
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
              {locale === 'en' ? 'CALCULATION BREAKDOWN' : 'RINCIAN PERHITUNGAN'} ({runwayMode === 'operational' ? t('dashboard.operationalRunway') : t('dashboard.totalRunway')})
            </Text>
          </View>

          <View className="bg-linen-surface/80 dark:bg-cypress-surface/60 rounded-2xl p-3 border border-linen-border/70 dark:border-cypress-border/50">
            {/* Row 1: Cash Balance */}
            <View className="flex-row justify-between items-center py-1">
              <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
                {runwayMode === 'operational' ? (locale === 'en' ? 'Active Cash Balance' : 'Saldo Kas Operasional') : (locale === 'en' ? 'Total Balance (Cash + Vault)' : 'Total Saldo (Kas + Tabungan)')}
              </Text>
              <Text className="text-xs font-mono font-bold text-linen-text-primary dark:text-cypress-text-primary tabular-nums">
                {formatCurrency(activeBalance, isPrivacyMode)}
              </Text>
            </View>

            {/* Row 2: Daily Burn Rate */}
            <View className="flex-row justify-between items-center py-1">
              <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
                {locale === 'en' ? 'Daily Average Burn Rate' : 'Rata-Rata Pengeluaran Harian'}
              </Text>
              <Text className="text-xs font-mono font-semibold text-linen-text-secondary dark:text-cypress-text-secondary tabular-nums">
                ÷ {formatCurrency(burnRate.dailyBurnRate, isPrivacyMode)}{t('dashboard.perDay')}
              </Text>
            </View>

            <View className="h-[1px] bg-linen-border/80 dark:border-cypress-border/60 my-1" />

            {/* Row 3: Rough Estimate */}
            <View className="flex-row justify-between items-center py-1">
              <Text className="text-xs font-medium text-linen-text-primary dark:text-cypress-text-primary">
                {locale === 'en' ? 'Rough Burn Ratio (Balance ÷ Burn)' : 'Estimasi Kasar Saldo ÷ Burn Rate'}
              </Text>
              <Text className="text-xs font-mono font-bold text-accent-brass dark:text-accent-champagne tabular-nums">
                ≈ {estimatedDaysRatio} {t('dashboard.days').toLowerCase()}
              </Text>
            </View>

            {/* Row 4: Calendar Simulation Result */}
            <View className="flex-row justify-between items-center pt-1.5 pb-0.5">
              <Text className="text-xs font-black text-linen-text-primary dark:text-cypress-text-primary">
                {locale === 'en' ? 'Simulation Discrete Result' : 'Ketahanan Hasil Simulasi'}
              </Text>
              <Text className="text-xs font-mono font-black text-status-safe tabular-nums">
                = {runway.isInfinite ? '∞' : `${activeDays} ${t('dashboard.days').toLowerCase()}`}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}

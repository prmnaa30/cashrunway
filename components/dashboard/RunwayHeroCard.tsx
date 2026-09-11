import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { Compass, ChevronDown, Calculator } from 'lucide-react-native';
import { formatCurrency, formatDate } from '@/lib/format';
import { RunwayResult, BurnRateResult } from '@/lib/engine';
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
  const colors = Colors[colorScheme];
  const [runwayMode, setRunwayMode] = useState<'operational' | 'total'>(defaultMode);
  const [isExpanded, setIsExpanded] = useState(false);
  const [tabWidth, setTabWidth] = useState(192);
  const tabAnim = useSharedValue(defaultMode === 'operational' ? 0 : 1);

  useEffect(() => {
    setRunwayMode(defaultMode);
    tabAnim.value = withTiming(defaultMode === 'operational' ? 0 : 1, {
      duration: 200,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  }, [defaultMode]);

  const handleSwitchMode = (mode: 'operational' | 'total') => {
    setRunwayMode(mode);
    // Smooth sliding pill indicator without bouncy jelly overshoot
    tabAnim.value = withTiming(mode === 'operational' ? 0 : 1, {
      duration: 200,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: withTiming(isExpanded ? '180deg' : '0deg', { duration: 220 }),
      },
    ],
  }));

  const pillStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: tabAnim.value * ((tabWidth - 6) / 2),
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
            Ketahanan Kas
          </Text>
          <Animated.View
            style={chevronStyle}
            className="ml-1.5 p-0.5 rounded-full bg-linen-surface dark:bg-cypress-surface"
          >
            <ChevronDown size={12} color={colors.textSecondary} />
          </Animated.View>
        </View>

        <View
          onLayout={(e) => setTabWidth(e.nativeEvent.layout.width)}
          className="relative flex-row p-0.5 rounded-xl bg-linen-bg dark:bg-cypress-surface border border-linen-border/80 dark:border-cypress-border w-44 overflow-hidden"
        >
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 2,
                bottom: 2,
                left: 2,
                width: (tabWidth - 6) / 2,
                borderRadius: 9,
              },
              pillStyle,
            ]}
            className="bg-white dark:bg-accent-champagne shadow-xs border border-linen-border/40 dark:border-transparent"
          />

          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              handleSwitchMode('operational');
            }}
            className="flex-1 py-1.5 items-center justify-center z-10 active:opacity-70"
          >
            <Text
              className={`text-[11px] font-bold ${
                runwayMode === 'operational'
                  ? 'text-linen-text-primary dark:text-[#0C1513]'
                  : 'text-linen-text-secondary dark:text-cypress-text-secondary'
              }`}
            >
              Kas Harian
            </Text>
          </Pressable>

          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              handleSwitchMode('total');
            }}
            className="flex-1 py-1.5 items-center justify-center z-10 active:opacity-70"
          >
            <Text
              className={`text-[11px] font-bold ${
                runwayMode === 'total'
                  ? 'text-linen-text-primary dark:text-[#0C1513]'
                  : 'text-linen-text-secondary dark:text-cypress-text-secondary'
              }`}
            >
              + Tabungan
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="my-2">
        <View className="flex-row items-baseline">
          <Text className="text-6xl font-black tracking-tight text-linen-text-primary dark:text-cypress-text-primary">
            {runway.isInfinite ? '∞' : runway.isDepleted ? '0' : activeDays}
          </Text>
          {!runway.isInfinite && (
            <Text className="ml-2 text-lg font-bold uppercase tracking-widest text-linen-text-secondary dark:text-cypress-text-secondary">
              HARI
            </Text>
          )}
        </View>

        <Text className="mt-1 text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
          {runway.isInfinite ? (
            'Pengeluaran Rp 0, uangmu sangat aman'
          ) : runway.isDepleted ? (
            'Saldo harian telah habis'
          ) : activeProjectedDate ? (
            <>
              Diperkirakan cukup sampai{' '}
              <Text className="font-bold text-linen-text-primary dark:text-cypress-text-primary">
                {formatDate(activeProjectedDate)}
              </Text>
            </>
          ) : (
            'Kondisi keuangan stabil'
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
            0 hr
          </Text>
          <Text className="text-[10px] text-linen-text-secondary/70 dark:text-cypress-text-secondary/70 font-mono">
            7 hr
          </Text>
          <Text className="text-[10px] text-linen-text-secondary/70 dark:text-cypress-text-secondary/70 font-mono">
            14 hr
          </Text>
          <Text className="text-[10px] text-linen-text-secondary/70 dark:text-cypress-text-secondary/70 font-mono">
            30 hr
          </Text>
          <Text className="text-[10px] text-linen-text-secondary/70 dark:text-cypress-text-secondary/70 font-mono">
            60+ hr
          </Text>
        </View>
      </View>

      <View className="mt-3 pt-3 border-t border-linen-border/60 dark:border-cypress-border/60 flex-row">
        <View className="flex-1 pr-2">
          <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary uppercase tracking-wider font-semibold">
            {runwayMode === 'operational' ? 'Kas Harian' : 'Total Kas (+Tabungan)'}
          </Text>
          <Text className="text-sm font-black text-linen-text-primary dark:text-cypress-text-primary mt-0.5">
            {formatCurrency(activeBalance, isPrivacyMode)}
          </Text>
        </View>

        <View className="w-[1px] bg-linen-border dark:bg-cypress-border mx-2" />

        <View className="flex-1 pl-2">
          <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary uppercase tracking-wider font-semibold">
            Rata-Rata Keluar
          </Text>
          <Text className="text-sm font-black text-linen-text-primary dark:text-cypress-text-primary mt-0.5">
            {formatCurrency(burnRate.dailyBurnRate, isPrivacyMode)}
            <Text className="text-xs font-normal text-linen-text-secondary dark:text-cypress-text-secondary">
              /hari
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
              Rincian Perhitungan ({runwayMode === 'operational' ? 'Kas Harian' : '+ Tabungan'})
            </Text>
          </View>

          <View className="bg-linen-surface/80 dark:bg-cypress-surface/60 rounded-2xl p-3 border border-linen-border/70 dark:border-cypress-border/50">
            {/* Row 1: Cash Balance */}
            <View className="flex-row justify-between items-center py-1">
              <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
                {runwayMode === 'operational' ? 'Saldo Kas Operasional' : 'Total Saldo (Kas + Tabungan)'}
              </Text>
              <Text className="text-xs font-mono font-bold text-linen-text-primary dark:text-cypress-text-primary">
                {formatCurrency(activeBalance, isPrivacyMode)}
              </Text>
            </View>

            {/* Row 2: Daily Burn Rate */}
            <View className="flex-row justify-between items-center py-1">
              <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
                Rata-Rata Pengeluaran Harian
              </Text>
              <Text className="text-xs font-mono font-semibold text-linen-text-secondary dark:text-cypress-text-secondary">
                ÷ {formatCurrency(burnRate.dailyBurnRate, isPrivacyMode)}/hari
              </Text>
            </View>

            <View className="h-[1px] bg-linen-border/80 dark:border-cypress-border/60 my-1" />

            {/* Row 3: Rough Estimate */}
            <View className="flex-row justify-between items-center py-1">
              <Text className="text-xs font-medium text-linen-text-primary dark:text-cypress-text-primary">
                Estimasi Kasar Saldo ÷ Burn Rate
              </Text>
              <Text className="text-xs font-mono font-bold text-accent-brass dark:text-accent-champagne">
                ≈ {estimatedDaysRatio} hari
              </Text>
            </View>

            {/* Row 4: Calendar Simulation Result */}
            <View className="flex-row justify-between items-center pt-1.5 pb-0.5">
              <Text className="text-xs font-black text-linen-text-primary dark:text-cypress-text-primary">
                Ketahanan Hasil Simulasi
              </Text>
              <Text className="text-xs font-mono font-black text-status-safe">
                = {runway.isInfinite ? '∞' : `${activeDays} hari`}
              </Text>
            </View>

            <Text className="mt-2 text-[10px] text-linen-text-secondary/80 dark:text-cypress-text-secondary/80 leading-3.5 italic">
              * Simulasi kalender menghitung hari demi hari dengan memperhitungkan tanggal jatuh tempo tagihan rutin aktif hingga dana habis.
            </Text>
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}

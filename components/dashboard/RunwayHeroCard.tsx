import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Compass } from 'lucide-react-native';
import { formatCurrency, formatDate } from '@/lib/format';
import { RunwayResult, BurnRateResult } from '@/lib/engine';
import Colors from '@/constants/Colors';

interface RunwayHeroCardProps {
  runway: RunwayResult;
  burnRate: BurnRateResult;
  operationalBalance: number;
  isPrivacyMode: boolean;
  statusColor: string;
  colorScheme: 'light' | 'dark';
}

export function RunwayHeroCard({
  runway,
  burnRate,
  operationalBalance,
  isPrivacyMode,
  statusColor,
  colorScheme,
}: RunwayHeroCardProps) {
  const colors = Colors[colorScheme];
  const [runwayMode, setRunwayMode] = useState<'operational' | 'total'>('operational');
  const [tabWidth, setTabWidth] = useState(192);
  const tabAnim = useSharedValue(0);

  const handleSwitchMode = (mode: 'operational' | 'total') => {
    setRunwayMode(mode);
    tabAnim.value = withSpring(mode === 'operational' ? 0 : 1, {
      damping: 55,
      stiffness: 400,
    });
  };

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

  return (
    <View className="rounded-3xl bg-linen-card dark:bg-cypress-card border border-linen-border dark:border-cypress-border p-5 mb-4">
      <View className="flex-row items-center justify-between pb-3 border-b border-linen-border/60 dark:border-cypress-border/60 mb-4">
        <View className="flex-row items-center">
          <Compass size={16} color={colors.tint} />
          <Text className="ml-1.5 text-xs font-bold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary">
            Ketahanan Kas
          </Text>
        </View>

        <View
          onLayout={(e) => setTabWidth(e.nativeEvent.layout.width)}
          className="relative flex-row p-0.5 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border w-48 overflow-hidden"
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
            className="bg-accent-brass dark:bg-accent-champagne shadow-sm"
          />

          <Pressable
            onPress={() => handleSwitchMode('operational')}
            className="flex-1 py-1.5 items-center justify-center z-10 active:opacity-70"
          >
            <Text
              className={`text-[11px] font-bold ${
                runwayMode === 'operational'
                  ? 'text-[#0C1513]'
                  : 'text-linen-text-secondary dark:text-cypress-text-secondary'
              }`}
            >
              Kas Harian
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleSwitchMode('total')}
            className="flex-1 py-1.5 items-center justify-center z-10 active:opacity-70"
          >
            <Text
              className={`text-[11px] font-bold ${
                runwayMode === 'total'
                  ? 'text-[#0C1513]'
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
            Uang Siap Pakai
          </Text>
          <Text className="text-sm font-black text-linen-text-primary dark:text-cypress-text-primary mt-0.5">
            {formatCurrency(operationalBalance, isPrivacyMode)}
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
    </View>
  );
}

import React, { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { PieChart, ChevronDown } from 'lucide-react-native';
import { formatCurrency } from '@/lib/format';
import { Wallet } from '@/lib/db';
import { useTranslation } from '@/lib/i18n';
import Colors from '@/constants/Colors';

interface LiquidityBarProps {
  totalBalance: number;
  operationalBalance: number;
  wallets?: Wallet[];
  isPrivacyMode: boolean;
  colorScheme: 'light' | 'dark';
}

export function LiquidityBar({
  totalBalance,
  operationalBalance,
  wallets = [],
  isPrivacyMode,
  colorScheme,
}: LiquidityBarProps) {
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

  const operationalRatio = useMemo(() => {
    if (totalBalance <= 0) return 50;
    return Math.round((operationalBalance / totalBalance) * 100);
  }, [operationalBalance, totalBalance]);

  const vaultBalance = Math.max(0, totalBalance - operationalBalance);

  const operationalWallets = useMemo(
    () => wallets.filter((w) => w.isVault === 0),
    [wallets]
  );
  const vaultWallets = useMemo(
    () => wallets.filter((w) => w.isVault === 1),
    [wallets]
  );

  const operationalColor = '#10B981';
  const vaultColor = colorScheme === 'dark' ? '#D4AF37' : '#D97706';

  return (
    <Pressable
      onPress={() => setIsExpanded((prev) => !prev)}
      accessibilityRole="button"
      accessibilityLabel="Buka atau tutup rincian pembagian uang"
      className="rounded-3xl bg-linen-card dark:bg-cypress-card border border-linen-border dark:border-cypress-border p-4 overflow-hidden"
    >
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-row items-center">
          <PieChart size={15} color={colors.tint} />
          <Text className="ml-1.5 text-xs font-bold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary">
            {t('dashboard.liquidityTitle')}
          </Text>
          <Animated.View
            style={chevronStyle}
            className="ml-1.5 p-0.5 rounded-full bg-linen-surface dark:bg-cypress-surface"
          >
            <ChevronDown size={12} color={colors.textSecondary} />
          </Animated.View>
        </View>

        <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary tabular-nums">
          {t('dashboard.total')} {formatCurrency(totalBalance, isPrivacyMode)}
        </Text>
      </View>

      <View>
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

        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <View
              className="w-2.5 h-2.5 rounded-sm mr-1.5"
              style={{ backgroundColor: operationalColor }}
            />
            <Text className="text-xs font-medium text-linen-text-primary dark:text-cypress-text-primary">
              {t('dashboard.operationalCash')} ({operationalRatio}%)
            </Text>
          </View>

          <View className="flex-row items-center">
            <View
              className="w-2.5 h-2.5 rounded-sm mr-1.5"
              style={{ backgroundColor: vaultColor }}
            />
            <Text className="text-xs font-medium text-linen-text-primary dark:text-cypress-text-primary">
              {t('dashboard.savingsVault')} ({100 - operationalRatio}%)
            </Text>
          </View>
        </View>
      </View>

      {/* Expandable Breakdown of Wallets */}
      {isExpanded && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={LinearTransition.duration(200)}
          className="mt-3.5 pt-3 border-t border-dashed border-linen-border dark:border-cypress-border/80"
        >
          {/* Operational Group */}
          <View className="mb-2.5">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary mb-1">
              {t('dashboard.operationalCash')} ({formatCurrency(operationalBalance, isPrivacyMode)})
            </Text>
            {operationalWallets.length === 0 ? (
              <Text className="text-xs text-linen-text-secondary/70 dark:text-cypress-text-secondary/70 italic">
                {locale === 'en' ? 'No active cash accounts' : 'Belum ada akun kas'}
              </Text>
            ) : (
              operationalWallets.map((w) => (
                <View key={w.id} className="flex-row justify-between py-0.5">
                  <Text className="text-xs text-linen-text-primary dark:text-cypress-text-primary">
                    {w.name}
                  </Text>
                  <Text className="text-xs font-mono text-linen-text-secondary dark:text-cypress-text-secondary tabular-nums">
                    {formatCurrency(w.balance, isPrivacyMode)}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* Vault Group */}
          <View>
            <Text className="text-[11px] font-bold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary mb-1">
              {t('dashboard.savingsVault')} ({formatCurrency(vaultBalance, isPrivacyMode)})
            </Text>
            {vaultWallets.length === 0 ? (
              <Text className="text-xs text-linen-text-secondary/70 dark:text-cypress-text-secondary/70 italic">
                {locale === 'en' ? 'No savings vaults' : 'Belum ada brankas tabungan'}
              </Text>
            ) : (
              vaultWallets.map((w) => (
                <View key={w.id} className="flex-row justify-between py-0.5">
                  <Text className="text-xs text-linen-text-primary dark:text-cypress-text-primary">
                    {w.name}
                  </Text>
                  <Text className="text-xs font-mono text-linen-text-secondary dark:text-cypress-text-secondary tabular-nums">
                    {formatCurrency(w.balance, isPrivacyMode)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}

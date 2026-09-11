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
            Pembagian Uangmu
          </Text>
          <Animated.View
            style={chevronStyle}
            className="ml-1.5 p-0.5 rounded-full bg-linen-surface dark:bg-cypress-surface"
          >
            <ChevronDown size={12} color={colors.textSecondary} />
          </Animated.View>
        </View>

        <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary">
          Total {formatCurrency(totalBalance, isPrivacyMode)}
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

        <View className="flex-row justify-between">
          <View className="flex-row items-center">
            <View
              className="w-2.5 h-2.5 rounded-sm mr-1.5"
              style={{ backgroundColor: operationalColor }}
            />
            <Text className="text-xs font-semibold text-linen-text-secondary dark:text-cypress-text-secondary">
              Uang Harian ({operationalRatio}%)
            </Text>
          </View>

          <View className="flex-row items-center">
            <View
              className="w-2.5 h-2.5 rounded-sm mr-1.5"
              style={{ backgroundColor: vaultColor }}
            />
            <Text className="text-xs font-semibold text-linen-text-secondary dark:text-cypress-text-secondary">
              Tabungan ({100 - operationalRatio}%)
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
          className="mt-4 pt-3.5 border-t border-dashed border-linen-border dark:border-cypress-border/80"
        >
          <View className="bg-linen-surface/80 dark:bg-cypress-surface/60 rounded-2xl p-3 border border-linen-border/70 dark:border-cypress-border/50">
            {/* Operational Section */}
            <View className="flex-row justify-between items-center mb-1.5">
              <View className="flex-row items-center">
                <View
                  className="w-2 h-2 rounded-full mr-1.5"
                  style={{ backgroundColor: operationalColor }}
                />
                <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary">
                  Uang Harian (Kas Aktif)
                </Text>
              </View>
              <Text className="text-xs font-mono font-bold text-status-safe">
                {formatCurrency(operationalBalance, isPrivacyMode)}
              </Text>
            </View>

            {operationalWallets.length > 0 ? (
              operationalWallets.map((w) => (
                <View key={w.id} className="flex-row justify-between items-center py-1 pl-3.5 pr-1">
                  <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary">
                    • {w.name}
                  </Text>
                  <Text className="text-[11px] font-mono text-linen-text-secondary dark:text-cypress-text-secondary">
                    {formatCurrency(w.balance, isPrivacyMode)}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-[11px] pl-3.5 text-linen-text-secondary/70 italic py-0.5">
                Tidak ada dompet harian
              </Text>
            )}

            <View className="h-[1px] bg-linen-border/80 dark:border-cypress-border/60 my-2" />

            {/* Vault Section */}
            <View className="flex-row justify-between items-center mb-1.5">
              <View className="flex-row items-center">
                <View
                  className="w-2 h-2 rounded-full mr-1.5"
                  style={{ backgroundColor: vaultColor }}
                />
                <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary">
                  Tabungan / Vault (Terkunci)
                </Text>
              </View>
              <Text className="text-xs font-mono font-bold text-accent-brass dark:text-accent-champagne">
                {formatCurrency(vaultBalance, isPrivacyMode)}
              </Text>
            </View>

            {vaultWallets.length > 0 ? (
              vaultWallets.map((w) => (
                <View key={w.id} className="flex-row justify-between items-center py-1 pl-3.5 pr-1">
                  <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary">
                    • {w.name}
                  </Text>
                  <Text className="text-[11px] font-mono text-linen-text-secondary dark:text-cypress-text-secondary">
                    {formatCurrency(w.balance, isPrivacyMode)}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-[11px] pl-3.5 text-linen-text-secondary/70 italic py-0.5">
                Belum ada dompet tabungan
              </Text>
            )}
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}

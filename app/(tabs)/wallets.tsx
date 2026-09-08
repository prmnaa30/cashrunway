import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Eye, EyeOff } from 'lucide-react-native';
import { formatCurrency } from '@/lib/format';
import { useSettingsStore } from '@/store/useSettingStore';
import { useFinanceStore } from '@/store/useFinanceStore';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { WalletCard, VaultYieldCard, VaultCard } from '@/components/wallets';

export default function WalletsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { isPrivacyMode, togglePrivacyMode } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<'operational' | 'vault'>('operational');
  const [tabWidth, setTabWidth] = useState(300);
  const tabAnim = useSharedValue(0);

  const handleSwitchTab = (tab: 'operational' | 'vault') => {
    setActiveTab(tab);
    tabAnim.value = withSpring(tab === 'operational' ? 0 : 1, {
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

  const {
    wallets,
    operationalBalance,
    vaultBalance,
    totalBalance,
    vaultStats,
    isLoading,
    loadAllData,
    applyVaultAccrual,
  } = useFinanceStore();

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const operationalWallets = useMemo(
    () => wallets.filter((w) => w.isVault === 0),
    [wallets]
  );

  const vaultWallets = useMemo(
    () => wallets.filter((w) => w.isVault === 1),
    [wallets]
  );

  return (
    <ScrollView
      className="flex-1 bg-linen-bg dark:bg-cypress-bg px-5"
      style={{ paddingTop: Math.max(insets.top + 8, 16) }}
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => loadAllData({ force: true, showLoading: true })}
          tintColor={colors.tint}
          colors={[colors.tint]}
        />
      }
    >
      <View className="flex-row items-center justify-between pb-4 pt-1">
        <View>
          <Text className="text-xl font-black text-linen-text-primary dark:text-cypress-text-primary tracking-tight">
            Dompet & Tabungan
          </Text>
          <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary">
            Pengaturan kas harian dan dana simpanan
          </Text>
        </View>

        <Pressable
          onPress={togglePrivacyMode}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="w-9 h-9 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border/80 dark:border-cypress-border/80 items-center justify-center active:opacity-70"
          accessibilityLabel="Sensor Angka"
        >
          {isPrivacyMode ? (
            <EyeOff size={16} color={colors.textSecondary} />
          ) : (
            <Eye size={16} color={colors.textSecondary} />
          )}
        </Pressable>
      </View>

      <View className="rounded-3xl bg-linen-card dark:bg-cypress-card border border-linen-border dark:border-cypress-border p-5 mb-4">
        <Text className="text-[11px] font-bold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary">
          Total Saldo Keseluruhan
        </Text>
        <Text className="text-4xl font-black tracking-tight text-linen-text-primary dark:text-cypress-text-primary mt-1">
          {formatCurrency(totalBalance, isPrivacyMode)}
        </Text>

        <View className="mt-4 pt-3 border-t border-linen-border/60 dark:border-cypress-border/60 flex-row justify-between">
          <View>
            <Text className="text-[10px] uppercase font-semibold text-linen-text-secondary dark:text-cypress-text-secondary tracking-wider">
              Uang Harian Siap Pakai
            </Text>
            <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary mt-0.5">
              {formatCurrency(operationalBalance, isPrivacyMode)}
            </Text>
          </View>

          <View className="items-end">
            <Text className="text-[10px] uppercase font-semibold text-linen-text-secondary dark:text-cypress-text-secondary tracking-wider">
              Tabungan Dingin
            </Text>
            <Text className="text-xs font-bold text-accent-brass dark:text-accent-champagne mt-0.5">
              {formatCurrency(vaultBalance, isPrivacyMode)}
            </Text>
          </View>
        </View>
      </View>

      <View
        onLayout={(e) => setTabWidth(e.nativeEvent.layout.width)}
        className="relative flex-row p-0.5 rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border mb-4 overflow-hidden"
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 2,
              bottom: 2,
              left: 2,
              width: (tabWidth - 6) / 2,
              borderRadius: 12,
            },
            pillStyle,
          ]}
          className="bg-accent-brass dark:bg-accent-champagne shadow-sm"
        />

        <Pressable
          onPress={() => handleSwitchTab('operational')}
          className="flex-1 py-2.5 items-center justify-center z-10 active:opacity-70"
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'operational'
                ? 'text-[#0C1513]'
                : 'text-linen-text-secondary dark:text-cypress-text-secondary'
            }`}
          >
            Uang Harian ({operationalWallets.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => handleSwitchTab('vault')}
          className="flex-1 py-2.5 items-center justify-center z-10 active:opacity-70"
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'vault'
                ? 'text-[#0C1513]'
                : 'text-linen-text-secondary dark:text-cypress-text-secondary'
            }`}
          >
            Tabungan ({vaultWallets.length})
          </Text>
        </Pressable>
      </View>

      {activeTab === 'operational' && (
        <View className="space-y-3">
          {operationalWallets.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              totalOperationalBalance={operationalBalance}
              isPrivacyMode={isPrivacyMode}
              colorScheme={colorScheme}
            />
          ))}
        </View>
      )}

      {activeTab === 'vault' && (
        <View>
          <VaultYieldCard
            vaultStats={vaultStats}
            isPrivacyMode={isPrivacyMode}
            colorScheme={colorScheme}
            onAccrue={applyVaultAccrual}
          />

          <Text className="text-xs font-bold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary mb-2 px-1">
            Daftar Tabungan & Brankas
          </Text>

          <View className="space-y-3">
            {vaultWallets.map((wallet) => (
              <VaultCard
                key={wallet.id}
                wallet={wallet}
                isPrivacyMode={isPrivacyMode}
                colorScheme={colorScheme}
              />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

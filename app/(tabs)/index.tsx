import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react-native';
import { formatDate } from '@/lib/format';
import { useSettingsStore } from '@/store/useSettingStore';
import { useFinanceStore } from '@/store/useFinanceStore';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import {
  RunwayHeroCard,
  SafeSpendCard,
  LiquidityBar,
} from '@/components/dashboard';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { isPrivacyMode, togglePrivacyMode } = useSettingsStore();

  const {
    operationalBalance,
    totalBalance,
    wallets,
    burnRate,
    runway,
    safeSpend,
    transactions,
    settings,
    isLoading,
    isInitialized,
    loadAllData,
    seedDemoData,
  } = useFinanceStore();

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const isDangerZone =
    !runway.isInfinite &&
    (runway.status === 'critical' || runway.operationalRunwayDays < 7);

  const isDemoPromptVisible =
    isInitialized && totalBalance === 0 && transactions.length === 0;

  const statusColor =
    runway.status === 'healthy'
      ? '#10B981'
      : runway.status === 'warning'
      ? '#F59E0B'
      : '#EF4444';

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
        <View className="flex-row items-center">
          <View
            className="w-2.5 h-2.5 rounded-full mr-2.5"
            style={{ backgroundColor: statusColor }}
          />
          <View>
            <Text className="text-lg font-black text-linen-text-primary dark:text-cypress-text-primary tracking-tight">
              CashRunway
            </Text>
            <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary">
              {formatDate(new Date())}
            </Text>
          </View>
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

      {isDangerZone && (
        <View className="mb-4 rounded-2xl bg-status-danger/10 border-l-4 border-l-status-danger border border-status-danger/30 p-3.5">
          <View className="flex-row items-center">
            <AlertTriangle size={17} color="#EF4444" />
            <Text className="ml-2 text-xs font-bold uppercase tracking-wider text-status-danger">
              Uang Harian Menipis (&lt; 7 Hari)
            </Text>
          </View>
          <Text className="mt-1 text-xs text-status-danger/90 leading-5">
            Sisa uang harianmu diperkirakan tinggal {runway.operationalRunwayDays} hari lagi. Tahan pengeluaran yang belum mendesak atau ambil dana dari tabungan.
          </Text>
        </View>
      )}

      {isDemoPromptVisible && (
        <View className="mb-4 p-4 rounded-2xl bg-linen-card dark:bg-cypress-card border border-accent-brass/30 dark:border-accent-champagne/30">
          <Text className="text-sm font-bold text-linen-text-primary dark:text-cypress-text-primary">
            Belum ada catatan keuangan
          </Text>
          <Text className="mt-1 text-xs text-linen-text-secondary dark:text-cypress-text-secondary leading-4">
            Muat saldo awal dan transaksi contoh agar kamu bisa langsung mencoba fitur ketahanan uang.
          </Text>
          <Pressable
            onPress={seedDemoData}
            className="mt-3 py-2 px-4 rounded-xl bg-cypress-surface dark:bg-accent-champagne self-start active:opacity-80 shadow-xs"
          >
            <Text className="text-xs font-bold text-white dark:text-[#0C1513]">
              Isi Data Contoh
            </Text>
          </Pressable>
        </View>
      )}

      {/* Runway Hero Card */}
      <RunwayHeroCard
        runway={runway}
        burnRate={burnRate}
        operationalBalance={operationalBalance}
        totalBalance={totalBalance}
        isPrivacyMode={isPrivacyMode}
        statusColor={statusColor}
        colorScheme={colorScheme}
      />

      {/* Safe Spend Card */}
      <SafeSpendCard
        safeSpend={safeSpend}
        operationalBalance={operationalBalance}
        isPrivacyMode={isPrivacyMode}
        colorScheme={colorScheme}
      />

      {/* Liquidity Breakdown Bar */}
      <LiquidityBar
        totalBalance={totalBalance}
        operationalBalance={operationalBalance}
        wallets={wallets}
        isPrivacyMode={isPrivacyMode}
        colorScheme={colorScheme}
      />
    </ScrollView>
  );
}

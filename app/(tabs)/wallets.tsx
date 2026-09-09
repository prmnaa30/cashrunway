import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Eye, EyeOff, Plus } from 'lucide-react-native';
import { formatCurrency } from '@/lib/format';
import { useSettingsStore } from '@/store/useSettingStore';
import { useFinanceStore } from '@/store/useFinanceStore';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Wallet } from '@/lib/db';
import {
  WalletCard,
  VaultYieldCard,
  VaultCard,
  WalletFormSheet,
  AdjustBalanceModal,
  DeleteWalletModal,
  WalletActionMenuModal,
} from '@/components/wallets';

export default function WalletsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { isPrivacyMode, togglePrivacyMode } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<'operational' | 'vault'>('operational');
  const [tabWidth, setTabWidth] = useState(300);
  const tabAnim = useSharedValue(0);

  // Modals state
  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  const [selectedWalletForEdit, setSelectedWalletForEdit] = useState<Wallet | null>(null);

  const [selectedWalletForAction, setSelectedWalletForAction] = useState<Wallet | null>(null);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  const [selectedWalletForAdjust, setSelectedWalletForAdjust] = useState<Wallet | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  const [selectedWalletForDelete, setSelectedWalletForDelete] = useState<Wallet | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleSwitchTab = (tab: 'operational' | 'vault') => {
    setActiveTab(tab);
    // Smooth sliding pill indicator without bouncy jelly overshoot
    tabAnim.value = withTiming(tab === 'operational' ? 0 : 1, {
      duration: 200,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
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
    createWallet,
    editWallet,
    adjustBalance,
    removeWallet,
    applyVaultAccrualForWallet,
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

  // Map pending accrual per wallet for O(1) card lookup
  const pendingAccrualMap = useMemo(() => {
    const map = new Map<string, (typeof vaultStats.pendingAccruals)[0]>();
    for (const accrual of vaultStats.pendingAccruals) {
      map.set(accrual.walletId, accrual);
    }
    return map;
  }, [vaultStats.pendingAccruals]);

  // Handlers
  const handleOpenCreateWallet = () => {
    setSelectedWalletForEdit(null);
    setIsFormSheetOpen(true);
  };

  const handleOpenActionMenu = (wallet: Wallet) => {
    setSelectedWalletForAction(wallet);
    setIsActionMenuOpen(true);
  };

  const handleTriggerEdit = (wallet: Wallet) => {
    setSelectedWalletForEdit(wallet);
    setIsFormSheetOpen(true);
  };

  const handleTriggerAdjust = (wallet: Wallet) => {
    setSelectedWalletForAdjust(wallet);
    setIsAdjustModalOpen(true);
  };

  const handleTriggerDelete = (wallet: Wallet) => {
    setSelectedWalletForDelete(wallet);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (data: {
    name: string;
    type: 'cash' | 'bank' | 'ewallet';
    isVault: boolean;
    initialBalance?: number;
    isInterestEnabled?: boolean;
    interestRate?: number;
    autoTax?: boolean;
    taxRate?: number;
    taxThreshold?: number;
  }) => {
    if (selectedWalletForEdit) {
      await editWallet(selectedWalletForEdit.id, {
        name: data.name,
        type: data.type,
        isInterestEnabled: data.isInterestEnabled ? 1 : 0,
        interestRate: data.interestRate,
        autoTax: data.autoTax ? 1 : 0,
        taxRate: data.taxRate,
        taxThreshold: data.taxThreshold,
      });
    } else {
      await createWallet(data);
    }
  };

  const handleAdjustBalanceConfirm = async (walletId: string, newBalance: number) => {
    await adjustBalance(walletId, newBalance);
  };

  const handleDeleteWalletConfirm = async (walletId: string) => {
    await removeWallet(walletId);
  };

  return (
    <View className="flex-1 bg-linen-bg dark:bg-cypress-bg">
      <ScrollView
        className="flex-1 px-5"
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
        {/* Header */}
      <View className="flex-row items-center justify-between pb-4 pt-1">
        <View>
          <Text className="text-xl font-black text-linen-text-primary dark:text-cypress-text-primary tracking-tight">
            Dompet & Tabungan
          </Text>
          <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary">
            Pengaturan kas harian dan dana simpanan
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={handleOpenCreateWallet}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="flex-row items-center px-3 py-2 rounded-xl bg-accent-brass dark:bg-accent-champagne active:opacity-80 shadow-sm"
            accessibilityLabel="Tambah Dompet"
          >
            <Plus size={14} color="#0C1513" strokeWidth={2.5} />
            <Text className="ml-1 text-xs font-black text-[#0C1513]">Tambah</Text>
          </Pressable>

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
      </View>

      {/* Total Balance Overview */}
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
              Tabungan
            </Text>
            <Text className="text-xs font-bold text-accent-brass dark:text-accent-champagne mt-0.5">
              {formatCurrency(vaultBalance, isPrivacyMode)}
            </Text>
          </View>
        </View>
      </View>

      {/* Segmented Tab Switcher */}
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

      {/* Tab Content: Daily Operational Cash */}
      {activeTab === 'operational' && (
        <View className="space-y-3">
          {operationalWallets.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              totalOperationalBalance={operationalBalance}
              isPrivacyMode={isPrivacyMode}
              colorScheme={colorScheme}
              onOpenOptions={handleOpenActionMenu}
            />
          ))}

          {operationalWallets.length === 0 && (
            <View className="p-8 rounded-3xl bg-linen-card dark:bg-cypress-card border border-dashed border-linen-border dark:border-cypress-border items-center justify-center">
              <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary text-center">
                Belum ada dompet harian aktif.{'\n'}Klik tombol "+ Tambah" di atas untuk membuat baru.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Tab Content: Vault Savings */}
      {activeTab === 'vault' && (
        <View>
          {/* Summary Overview Card without global claim button */}
          <VaultYieldCard
            vaultStats={vaultStats}
            isPrivacyMode={isPrivacyMode}
            colorScheme={colorScheme}
          />

          <View className="flex-row items-center justify-between mb-2 px-1">
            <Text className="text-xs font-bold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary">
              Daftar Tabungan & Brankas
            </Text>
          </View>

          <View className="space-y-3">
            {vaultWallets.map((wallet) => (
              <VaultCard
                key={wallet.id}
                wallet={wallet}
                pendingAccrual={pendingAccrualMap.get(wallet.id)}
                isPrivacyMode={isPrivacyMode}
                colorScheme={colorScheme}
                onAccrue={applyVaultAccrualForWallet}
                onOpenOptions={handleOpenActionMenu}
              />
            ))}

            {vaultWallets.length === 0 && (
              <View className="p-8 rounded-3xl bg-linen-card dark:bg-cypress-card border border-dashed border-linen-border dark:border-cypress-border items-center justify-center">
                <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary text-center">
                  Belum ada akun tabungan aktif.{'\n'}Klik tombol "+ Tambah" di atas untuk membuat tabungan.
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
      </ScrollView>

      {/* Modals & Sheets */}
      <WalletFormSheet
        visible={isFormSheetOpen}
        walletToEdit={selectedWalletForEdit}
        defaultIsVault={activeTab === 'vault'}
        colorScheme={colorScheme}
        onClose={() => {
          setIsFormSheetOpen(false);
          setSelectedWalletForEdit(null);
        }}
        onSubmit={handleFormSubmit}
      />

      <WalletActionMenuModal
        visible={isActionMenuOpen}
        wallet={selectedWalletForAction}
        colorScheme={colorScheme}
        onClose={() => {
          setIsActionMenuOpen(false);
          setSelectedWalletForAction(null);
        }}
        onEdit={handleTriggerEdit}
        onAdjustBalance={handleTriggerAdjust}
        onDelete={handleTriggerDelete}
      />

      <AdjustBalanceModal
        visible={isAdjustModalOpen}
        wallet={selectedWalletForAdjust}
        isPrivacyMode={isPrivacyMode}
        colorScheme={colorScheme}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setSelectedWalletForAdjust(null);
        }}
        onConfirm={handleAdjustBalanceConfirm}
      />

      <DeleteWalletModal
        visible={isDeleteModalOpen}
        wallet={selectedWalletForDelete}
        isPrivacyMode={isPrivacyMode}
        colorScheme={colorScheme}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedWalletForDelete(null);
        }}
        onConfirm={handleDeleteWalletConfirm}
      />
    </View>
  );
}

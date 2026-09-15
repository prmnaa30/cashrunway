import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, EyeOff, Plus } from 'lucide-react-native';
import { formatCurrency } from '@/lib/format';
import { useSettingsStore } from '@/store/useSettingStore';
import { useFinanceStore } from '@/store/useFinanceStore';
import { useTranslation } from '@/lib/i18n';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Wallet } from '@/lib/db';
import { AppSegmentedTabs } from '@/components/ui/AppSegmentedTabs';
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
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { isPrivacyMode, togglePrivacyMode } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<'operational' | 'vault'>('operational');

  // Modals state
  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  const [selectedWalletForEdit, setSelectedWalletForEdit] = useState<Wallet | null>(null);

  const [selectedWalletForAction, setSelectedWalletForAction] = useState<Wallet | null>(null);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  const [selectedWalletForAdjust, setSelectedWalletForAdjust] = useState<Wallet | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  const [selectedWalletForDelete, setSelectedWalletForDelete] = useState<Wallet | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
        isVault: data.isVault ? 1 : 0,
        isInterestEnabled: data.isInterestEnabled !== undefined ? (data.isInterestEnabled ? 1 : 0) : undefined,
        interestRate: data.interestRate,
        autoTax: data.autoTax !== undefined ? (data.autoTax ? 1 : 0) : undefined,
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
              {t('wallets.title')}
            </Text>
            <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary">
          {t('wallets.subtitleDesc')}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={handleOpenCreateWallet}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="flex-row items-center px-3 py-2 rounded-xl bg-cypress-surface dark:bg-accent-champagne active:opacity-80 shadow-xs"
              accessibilityLabel={t('wallets.addWalletButton')}
            >
              <Plus size={14} color={colorScheme === 'dark' ? '#0C1513' : '#D4AF37'} strokeWidth={2.5} />
              <Text className="ml-1 text-xs font-black text-white dark:text-[#0C1513]">
                {t('wallets.addButtonLabel')}
              </Text>
            </Pressable>

            <Pressable
              onPress={togglePrivacyMode}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-9 h-9 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border/80 dark:border-cypress-border/80 items-center justify-center active:opacity-70"
              accessibilityLabel={t('dashboard.privacyToggle')}
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
            {t('wallets.totalLiquidBalance')}
          </Text>
          <Text className="text-4xl font-black tracking-tight text-linen-text-primary dark:text-cypress-text-primary mt-1">
            {formatCurrency(totalBalance, isPrivacyMode)}
          </Text>

          <View className="mt-4 pt-3 border-t border-linen-border/60 dark:border-cypress-border/60 flex-row justify-between">
            <View>
              <Text className="text-[10px] uppercase font-semibold text-linen-text-secondary dark:text-cypress-text-secondary tracking-wider">
                {t('wallets.totalOperational')}
              </Text>
              <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary mt-0.5">
                {formatCurrency(operationalBalance, isPrivacyMode)}
              </Text>
            </View>

            <View className="items-end">
              <Text className="text-[10px] uppercase font-semibold text-linen-text-secondary dark:text-cypress-text-secondary tracking-wider">
                {t('wallets.totalVault')}
              </Text>
              <Text className="text-xs font-bold text-accent-brass dark:text-accent-champagne mt-0.5">
                {formatCurrency(vaultBalance, isPrivacyMode)}
              </Text>
            </View>
          </View>
        </View>

        {/* Reanimated Segmented Tab Switcher */}
        <View className="mb-4">
          <AppSegmentedTabs<'operational' | 'vault'>
            value={activeTab}
            onChange={(val) => setActiveTab(val)}
            options={[
              { key: 'operational', label: `${t('wallets.tabOperational')} (${operationalWallets.length})` },
              { key: 'vault', label: `${t('wallets.tabVault')} (${vaultWallets.length})` },
            ]}
          />
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
                  {t('wallets.emptyOperationalTitle')}. {t('wallets.emptyOperationalHint')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Tab Content: Vault Savings */}
        {activeTab === 'vault' && (
          <View>
            <VaultYieldCard
              vaultStats={vaultStats}
              isPrivacyMode={isPrivacyMode}
              colorScheme={colorScheme}
            />

            <View className="flex-row items-center justify-between mb-2 px-1">
              <Text className="text-xs font-bold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary">
                {t('wallets.tabVault')} ({vaultWallets.length})
              </Text>
            </View>

            <View className="space-y-3">
              {vaultWallets.map((wallet) => (
                <VaultCard
                  key={wallet.id}
                  wallet={wallet}
                  pendingAccrual={vaultStats.pendingAccruals.find((a) => a.walletId === wallet.id)}
                  isPrivacyMode={isPrivacyMode}
                  colorScheme={colorScheme}
                  onOpenOptions={handleOpenActionMenu}
                  onAccrue={applyVaultAccrualForWallet}
                />
              ))}

              {vaultWallets.length === 0 && (
                <View className="p-8 rounded-3xl bg-linen-card dark:bg-cypress-card border border-dashed border-linen-border dark:border-cypress-border items-center justify-center">
                  <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary text-center">
                    {t('wallets.emptyVaultTitle')}. {t('wallets.emptyVaultHint')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Unified Modals and Sheets */}
      <WalletFormSheet
        visible={isFormSheetOpen}
        walletToEdit={selectedWalletForEdit}
        defaultIsVault={activeTab === 'vault'}
        colorScheme={colorScheme}
        onClose={() => setIsFormSheetOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <WalletActionMenuModal
        visible={isActionMenuOpen}
        wallet={selectedWalletForAction}
        colorScheme={colorScheme}
        onClose={() => setIsActionMenuOpen(false)}
        onEdit={handleTriggerEdit}
        onAdjustBalance={handleTriggerAdjust}
        onDelete={handleTriggerDelete}
      />

      <AdjustBalanceModal
        visible={isAdjustModalOpen}
        wallet={selectedWalletForAdjust}
        isPrivacyMode={isPrivacyMode}
        colorScheme={colorScheme}
        onClose={() => setIsAdjustModalOpen(false)}
        onConfirm={handleAdjustBalanceConfirm}
      />

      <DeleteWalletModal
        visible={isDeleteModalOpen}
        wallet={selectedWalletForDelete}
        isPrivacyMode={isPrivacyMode}
        colorScheme={colorScheme}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteWalletConfirm}
      />
    </View>
  );
}

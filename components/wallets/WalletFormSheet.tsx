import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Switch,
} from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Banknote, Landmark, Smartphone, Percent, AlertCircle } from 'lucide-react-native';
import { Wallet } from '@/lib/db';
import Colors from '@/constants/Colors';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { AppSegmentedTabs } from '@/components/ui/AppSegmentedTabs';
import { useTranslation } from '@/lib/i18n';

export interface WalletFormSheetProps {
  visible: boolean;
  walletToEdit?: Wallet | null;
  defaultIsVault?: boolean;
  colorScheme: 'light' | 'dark';
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: 'cash' | 'bank' | 'ewallet';
    isVault: boolean;
    initialBalance?: number;
    isInterestEnabled?: boolean;
    interestRate?: number;
    autoTax?: boolean;
    taxRate?: number;
    taxThreshold?: number;
  }) => Promise<void>;
}

export function WalletFormSheet({
  visible,
  walletToEdit,
  defaultIsVault = false,
  colorScheme,
  onClose,
  onSubmit,
}: WalletFormSheetProps) {
  const { t, locale } = useTranslation();
  const insets = useSafeAreaInsets();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const isEditMode = Boolean(walletToEdit);

  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'bank' | 'ewallet'>('bank');
  const [isVault, setIsVault] = useState(defaultIsVault);
  const [initialBalance, setInitialBalance] = useState('');
  const [isInterestEnabled, setIsInterestEnabled] = useState(false);
  const [interestRatePercent, setInterestRatePercent] = useState('3.75');
  const [autoTax, setAutoTax] = useState(true);
  const [taxRatePercent, setTaxRatePercent] = useState('20');
  const [taxThresholdStr, setTaxThresholdStr] = useState('7500000');
  const [taxPreset, setTaxPreset] = useState<'id_bank' | 'zero' | 'custom'>('id_bank');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (walletToEdit) {
        setName(walletToEdit.name);
        setType(walletToEdit.type as any);
        setIsVault(Boolean(walletToEdit.isVault));
        setInitialBalance('');
        setIsInterestEnabled(Boolean(walletToEdit.isInterestEnabled));
        setInterestRatePercent(
          walletToEdit.interestRate ? (walletToEdit.interestRate * 100).toString() : '3.75'
        );
        const hasAutoTax = walletToEdit.autoTax !== 0;
        setAutoTax(hasAutoTax);
        const ratePct = walletToEdit.taxRate !== undefined && walletToEdit.taxRate !== null
          ? (walletToEdit.taxRate * 100).toString()
          : '20';
        setTaxRatePercent(ratePct);
        const thresh = walletToEdit.taxThreshold !== undefined && walletToEdit.taxThreshold !== null
          ? walletToEdit.taxThreshold.toString()
          : '7500000';
        setTaxThresholdStr(thresh);

        if (!hasAutoTax || ratePct === '0') {
          setTaxPreset('zero');
        } else if (ratePct === '20' && thresh === '7500000') {
          setTaxPreset('id_bank');
        } else {
          setTaxPreset('custom');
        }
      } else {
        setName('');
        setType('bank');
        setIsVault(defaultIsVault);
        setInitialBalance('');
        setIsInterestEnabled(defaultIsVault);
        setInterestRatePercent('3.75');
        setAutoTax(true);
        setTaxRatePercent('20');
        setTaxThresholdStr('7500000');
        setTaxPreset('id_bank');
      }
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [visible, walletToEdit, defaultIsVault]);

  const handleSelectTaxPreset = (preset: 'id_bank' | 'zero' | 'custom') => {
    setTaxPreset(preset);
    if (preset === 'id_bank') {
      setAutoTax(true);
      setTaxRatePercent('20');
      setTaxThresholdStr('7500000');
    } else if (preset === 'zero') {
      setAutoTax(false);
      setTaxRatePercent('0');
      setTaxThresholdStr('0');
    } else {
      setAutoTax(true);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrorMsg(locale === 'en' ? 'Account name cannot be empty' : 'Nama dompet tidak boleh kosong');
      return;
    }

    const parsedInterest = parseFloat(interestRatePercent);
    if (isVault && isInterestEnabled && (isNaN(parsedInterest) || parsedInterest < 0)) {
      setErrorMsg(locale === 'en' ? 'Invalid interest rate' : 'Suku bunga tidak valid');
      return;
    }

    const parsedTaxRate = parseFloat(taxRatePercent);
    if (isVault && isInterestEnabled && autoTax && (isNaN(parsedTaxRate) || parsedTaxRate < 0 || parsedTaxRate > 100)) {
      setErrorMsg(locale === 'en' ? 'Invalid tax rate (0 - 100%)' : 'Tarif pajak tidak valid (0 - 100%)');
      return;
    }

    const parsedThreshold = parseFloat(taxThresholdStr.replace(/[^0-9.]/g, ''));
    if (isVault && isInterestEnabled && autoTax && (isNaN(parsedThreshold) || parsedThreshold < 0)) {
      setErrorMsg(locale === 'en' ? 'Invalid tax-exempt threshold' : 'Batas saldo bebas pajak tidak valid');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const balanceNum = initialBalance ? parseFloat(initialBalance.replace(/\D/g, '')) || 0 : 0;
      const rateDecimal = isVault && isInterestEnabled ? (parsedInterest || 0) / 100 : 0;
      const finalTaxRate = isVault && isInterestEnabled && autoTax ? (parsedTaxRate || 0) / 100 : 0;
      const finalTaxThreshold = isVault && isInterestEnabled && autoTax ? (parsedThreshold || 0) : 0;

      await onSubmit({
        name: name.trim(),
        type,
        isVault,
        initialBalance: isEditMode ? undefined : balanceNum,
        isInterestEnabled: isVault && isInterestEnabled,
        interestRate: rateDecimal,
        autoTax: isVault && isInterestEnabled ? autoTax : false,
        taxRate: finalTaxRate,
        taxThreshold: finalTaxThreshold,
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || (locale === 'en' ? 'Failed to save account' : 'Gagal menyimpan dompet'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const sheetTitle = isEditMode
    ? t('wallets.addModalTitleEdit')
    : isVault
    ? t('wallets.addModalTitleNewVault')
    : t('wallets.addModalTitleNewWallet');

  const sheetSubtitle = isVault
    ? (locale === 'en' ? 'Emergency and savings vault' : 'Akun simpanan/tabungan')
    : (locale === 'en' ? 'Active daily operational cash' : 'Akun kas harian operasional');

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title={sheetTitle}
      subtitle={sheetSubtitle}
      maxHeight="88%"
    >
      <ScrollView
        className="px-5 pt-4"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) }}
        showsVerticalScrollIndicator={false}
      >
        {errorMsg ? (
          <View className="mb-4 p-3 rounded-xl bg-status-danger/10 border border-status-danger/30 flex-row items-center">
            <AlertCircle size={16} color="#EF4444" />
            <Text className="ml-2 text-xs font-semibold text-status-danger flex-1">
              {errorMsg}
            </Text>
          </View>
        ) : null}

        {/* Segmented Account Category with Reanimated AppSegmentedTabs */}
        {!isEditMode && (
          <View className="mb-4">
            <Text className="text-xs font-bold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary mb-2">
              {t('wallets.accountCategory')}
            </Text>
            <AppSegmentedTabs<string>
              value={isVault ? 'vault' : 'operational'}
              onChange={(val) => {
                const willBeVault = val === 'vault';
                setIsVault(willBeVault);
                setIsInterestEnabled(willBeVault);
              }}
              options={[
                { key: 'operational', label: t('wallets.accountCategoryOperational') },
                { key: 'vault', label: t('wallets.accountCategoryVault') },
              ]}
            />
          </View>
        )}

        {/* Account Name */}
        <View className="mb-4">
          <Text className="text-xs font-bold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary mb-2">
            {t('wallets.walletNameLabel')}
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('wallets.walletNamePlaceholder')}
            placeholderTextColor={colors.textSecondary}
            className="w-full h-12 px-4 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border text-linen-text-primary dark:text-cypress-text-primary text-sm font-semibold"
          />
        </View>

        {/* Account Type Medium */}
        <View className="mb-4">
          <Text className="text-xs font-bold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary mb-2">
            {t('wallets.walletTypeLabel')}
          </Text>
          <View className="flex-row gap-2.5">
            {[
              { id: 'cash', label: t('wallets.walletTypeCash'), icon: Banknote },
              { id: 'bank', label: t('wallets.walletTypeBank'), icon: Landmark },
              { id: 'ewallet', label: t('wallets.walletTypeEwallet'), icon: Smartphone },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = type === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setType(item.id as any)}
                  className={`flex-1 py-3 px-2 rounded-2xl items-center justify-center border ${
                    isSelected
                      ? 'bg-linen-surface dark:bg-cypress-surface border-accent-brass dark:border-accent-champagne'
                      : 'bg-linen-surface/50 dark:bg-cypress-surface/40 border-linen-border dark:border-cypress-border'
                  }`}
                >
                  <Icon
                    size={20}
                    color={
                      isSelected
                        ? isDark
                          ? '#D4AF37'
                          : '#B8860B'
                        : colors.textSecondary
                    }
                  />
                  <Text
                    className={`text-xs font-bold mt-1.5 ${
                      isSelected
                        ? 'text-linen-text-primary dark:text-cypress-text-primary'
                        : 'text-linen-text-secondary dark:text-cypress-text-secondary'
                    }`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Initial Balance */}
        {!isEditMode && (
          <View className="mb-4">
            <Text className="text-xs font-bold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary mb-2">
              {t('wallets.initialBalanceLabel')}
            </Text>
            <TextInput
              value={initialBalance}
              onChangeText={setInitialBalance}
              placeholder={t('wallets.initialBalancePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              className="w-full h-12 px-4 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border text-linen-text-primary dark:text-cypress-text-primary text-sm font-semibold"
            />
          </View>
        )}

        {/* Animated Vault Yield & Tax section using LinearTransition */}
        <Animated.View layout={LinearTransition.duration(200)}>
          {isVault && (
            <View className="mb-4 p-4 rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-1 pr-2">
                  <Text className="text-sm font-bold text-linen-text-primary dark:text-cypress-text-primary">
                    {t('wallets.interestToggleLabel')}
                  </Text>
                  <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
                    {t('wallets.interestToggleDesc')}
                  </Text>
                </View>
                <Switch
                  value={isInterestEnabled}
                  onValueChange={setIsInterestEnabled}
                  trackColor={{ false: '#374151', true: isDark ? '#D4AF37' : '#B8860B' }}
                  thumbColor="#ffffff"
                />
              </View>

              {isInterestEnabled && (
                <Animated.View layout={LinearTransition.duration(200)} className="mt-3 pt-3 border-t border-linen-border/60 dark:border-cypress-border/60">
                  <Text className="text-xs font-bold text-linen-text-secondary dark:text-cypress-text-secondary mb-1.5">
                    {t('wallets.interestRateLabel')}
                  </Text>
                  <TextInput
                    value={interestRatePercent}
                    onChangeText={setInterestRatePercent}
                    placeholder="3.75"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    className="w-full h-11 px-3.5 rounded-xl bg-linen-bg dark:bg-cypress-card border border-linen-border dark:border-cypress-border text-linen-text-primary dark:text-cypress-text-primary font-mono text-sm"
                  />
                </Animated.View>
              )}
            </View>
          )}
        </Animated.View>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          className={`w-full py-3.5 rounded-2xl items-center justify-center mt-2 ${
            isSubmitting
              ? 'bg-linen-border dark:bg-cypress-border'
              : 'bg-cypress-surface dark:bg-accent-champagne'
          }`}
        >
          <Text className="text-sm font-black text-white dark:text-[#0C1513]">
            {isSubmitting ? t('common.loading') : t('wallets.saveAccount')}
          </Text>
        </Pressable>
      </ScrollView>
    </AppBottomSheet>
  );
}

import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Coins,
  Calendar,
  Sliders,
  TrendingDown,
  Tag,
  HelpCircle,
} from 'lucide-react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useFinanceStore } from '@/store/useFinanceStore';
import { useSettingsStore } from '@/store/useSettingStore';
import { formatCurrency, DEFAULT_FALLBACK_BURNS } from '@/lib/format';
import { useTranslation } from '@/lib/i18n';
import { AppSegmentedTabs } from '@/components/ui/AppSegmentedTabs';
import {
  SettingSection,
  SettingRow,
  BurnWindowExplainerSheet,
  FallbackBurnSheet,
  PaydayPickerModal,
  CurrencyPickerModal,
  ManageCategoriesModal,
  SettingsSubHeader,
} from '@/components/settings';

export default function FinancialPreferencesScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { t: translate } = useTranslation();

  const settings = useFinanceStore((s) => s.settings);
  const categories = useFinanceStore((s) => s.categories);
  const updateSettings = useFinanceStore((s) => s.updateSettings);

  const { currency, setCurrency } = useSettingsStore();

  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [isFallbackBurnOpen, setIsFallbackBurnOpen] = useState(false);
  const [isPaydayOpen, setIsPaydayOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);

  const activeBurnWindow = settings?.burnWindowDays ?? 14;
  const activePayday = settings?.paydayDay ?? 25;
  const activeFallbackBurn = settings?.fallbackDailyBurn ?? (DEFAULT_FALLBACK_BURNS[currency] || 50000);

  const handleSelectBurnWindow = async (days: number) => {
    await updateSettings({ burnWindowDays: days });
  };

  const handleSelectPayday = async (day: number) => {
    await updateSettings({ paydayDay: day });
  };

  const handleSelectCurrency = async (curr: string) => {
    setCurrency(curr);
    const suggestedBurn = DEFAULT_FALLBACK_BURNS[curr] || 50000;
    await updateSettings({ currency: curr, fallbackDailyBurn: suggestedBurn });
  };

  const handleSaveFallbackBurn = async (amount: number) => {
    await updateSettings({ fallbackDailyBurn: amount });
  };

  return (
    <View className="flex-1 bg-linen-bg dark:bg-cypress-bg" style={{ paddingTop: insets.top }}>
      <SettingsSubHeader
        title={translate('settings.sections.financial')}
        subtitle={translate('settings.subtitles.financial')}
      />

      <ScrollView
        className="flex-1 px-5 pt-5"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <SettingSection title={translate('settings.sections.financial')}>
          <SettingRow
            label={translate('settings.currency.title')}
            description={translate('settings.currency.desc')}
            icon={<Coins size={18} color={colors.tint} />}
            onPress={() => setIsCurrencyOpen(true)}
            action={
              <View className="px-3 py-1 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border">
                <Text className="text-xs font-mono font-bold text-accent-brass dark:text-accent-champagne">
                  {currency}
                </Text>
              </View>
            }
          />

          <SettingRow
            label={translate('settings.payday.title')}
            description={translate('settings.payday.desc')}
            icon={<Calendar size={18} color={colors.tint} />}
            onPress={() => setIsPaydayOpen(true)}
            action={
              <View className="px-3 py-1 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border">
                <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary">
                  {translate('settings.payday.valueFormat', { day: activePayday })}
                </Text>
              </View>
            }
          />

          {/* Rolling Burn Window Selector */}
          <View className="py-3.5 px-4 border-b border-linen-border/70 dark:border-cypress-border/70">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center flex-1 pr-2">
                <Sliders size={18} color={colors.tint} />
                <View className="flex-row items-center ml-3">
                  <Text className="text-sm font-semibold text-linen-text-primary dark:text-cypress-text-primary">
                    {translate('settings.burnWindow.title')}
                  </Text>
                  <Pressable
                    onPress={() => setIsExplainerOpen(true)}
                    className="ml-2 p-1 rounded-full active:opacity-60"
                    accessibilityLabel="Panduan rentang analisis"
                  >
                    <HelpCircle size={15} color={colors.textSecondary} />
                  </Pressable>
                </View>
              </View>
            </View>

            <View className="mb-2">
              <AppSegmentedTabs<number>
                size="sm"
                value={activeBurnWindow}
                onChange={(d) => handleSelectBurnWindow(d)}
                options={[
                  { key: 7, label: translate('settings.burnWindow.days', { days: 7 }) },
                  { key: 14, label: translate('settings.burnWindow.days', { days: 14 }) },
                  { key: 30, label: translate('settings.burnWindow.days', { days: 30 }) },
                ]}
              />
            </View>

            <Text className="text-[11px] text-linen-text-secondary/90 dark:text-cypress-text-secondary/90 leading-4">
              {activeBurnWindow === 7
                ? translate('settings.burnWindow.hint7')
                : activeBurnWindow === 30
                ? translate('settings.burnWindow.hint30')
                : translate('settings.burnWindow.hint14')}
            </Text>
          </View>

          <SettingRow
            label={translate('settings.fallbackBurn.title')}
            description={translate('settings.fallbackBurn.desc')}
            icon={<TrendingDown size={18} color={colors.tint} />}
            onPress={() => setIsFallbackBurnOpen(true)}
            action={
              <View className="px-3 py-1 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border">
                <Text className="text-xs font-mono font-bold text-accent-brass dark:text-accent-champagne">
                  {formatCurrency(activeFallbackBurn, { currency })}/hari
                </Text>
              </View>
            }
          />

          <SettingRow
            label={translate('settings.categories.title')}
            description={translate('settings.categories.desc')}
            icon={<Tag size={18} color={colors.tint} />}
            isLast
            onPress={() => setIsManageCategoriesOpen(true)}
            action={
              <View className="px-3 py-1 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border">
                <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary">
                  {translate('settings.categories.countBadge', { count: categories.length })}
                </Text>
              </View>
            }
          />
        </SettingSection>
      </ScrollView>

      {/* Modals & Sheets */}
      <BurnWindowExplainerSheet
        visible={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
      />

      <FallbackBurnSheet
        visible={isFallbackBurnOpen}
        currentBurn={activeFallbackBurn}
        currency={currency}
        onSave={handleSaveFallbackBurn}
        onClose={() => setIsFallbackBurnOpen(false)}
      />

      <PaydayPickerModal
        visible={isPaydayOpen}
        currentDay={activePayday}
        onSelect={handleSelectPayday}
        onClose={() => setIsPaydayOpen(false)}
      />

      <CurrencyPickerModal
        visible={isCurrencyOpen}
        currentCurrency={currency}
        onSelect={handleSelectCurrency}
        onClose={() => setIsCurrencyOpen(false)}
      />

      <ManageCategoriesModal
        visible={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
      />
    </View>
  );
}

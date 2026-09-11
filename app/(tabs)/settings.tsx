import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  HelpCircle,
  Coins,
  Calendar,
  Sliders,
  Shield,
  Globe,
  Download,
  RotateCcw,
  Trash2,
  TrendingDown,
  Info,
  SunMoon,
  Tag,
} from 'lucide-react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useFinanceStore } from '@/store/useFinanceStore';
import { useSettingsStore } from '@/store/useSettingStore';
import { formatCurrency, DEFAULT_FALLBACK_BURNS } from '@/lib/format';
import { useTranslation } from '@/lib/i18n';
import { exportAndShareTransactionsCsv } from '@/lib/export/csvExport';
import {
  SettingSection,
  SettingRow,
  BurnWindowExplainerSheet,
  FallbackBurnSheet,
  PaydayPickerModal,
  CurrencyPickerModal,
  DangerConfirmModal,
  ManageCategoriesModal,
} from '@/components/settings';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const { t: translate } = useTranslation();

  const settings = useFinanceStore((s) => s.settings);
  const transactions = useFinanceStore((s) => s.transactions);
  const categories = useFinanceStore((s) => s.categories);
  const updateSettings = useFinanceStore((s) => s.updateSettings);
  const resetToDemo = useFinanceStore((s) => s.resetToDemo);
  const clearTransactions = useFinanceStore((s) => s.clearTransactions);

  const { currency, setCurrency, themeMode, setThemeMode } = useSettingsStore();

  // Modals / Sheets state
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [isFallbackBurnOpen, setIsFallbackBurnOpen] = useState(false);
  const [isPaydayOpen, setIsPaydayOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [dangerModal, setDangerModal] = useState<{
    visible: boolean;
    type: 'reset' | 'clear';
  }>({ visible: false, type: 'reset' });

  const [isExporting, setIsExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const activeBurnWindow = settings?.burnWindowDays ?? 14;
  const activePayday = settings?.paydayDay ?? 25;
  const activeLanguage = settings?.language ?? 'auto';
  const activeThemeMode = settings?.themeMode || themeMode || 'system';
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

  const handleSelectLanguage = async (lang: string) => {
    await updateSettings({ language: lang });
  };

  const handleSelectTheme = async (mode: 'system' | 'light' | 'dark') => {
    setThemeMode(mode);
    await updateSettings({ themeMode: mode });
  };

  const handleExportCsv = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportFeedback(null);
    try {
      const result = await exportAndShareTransactionsCsv(transactions);
      if (result.success) {
        setExportFeedback(translate('settings.exportCsv.success'));
      } else {
        setExportFeedback(translate('settings.exportCsv.noData'));
      }
    } catch (err) {
      console.error(err);
      setExportFeedback('Gagal mengekspor CSV');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportFeedback(null), 3500);
    }
  };

  return (
    <View className="flex-1 bg-linen-bg dark:bg-cypress-bg">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 80,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-black tracking-tight text-linen-text-primary dark:text-cypress-text-primary mb-1">
          {translate('settings.title')}
        </Text>
        <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary mb-6">
          {translate('settings.aboutInfo.tagline')}
        </Text>

        {/* 1. FINANCIAL PREFERENCES */}
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
                    accessibilityLabel="Panduan kelebihan dan kekurangan rentang analisis"
                  >
                    <HelpCircle size={15} color={colors.textSecondary} />
                  </Pressable>
                </View>
              </View>
            </View>

            <View className="flex-row p-1 rounded-xl bg-linen-bg dark:bg-cypress-surface border border-linen-border/80 dark:border-cypress-border/80 mb-2">
              {[7, 14, 30].map((d) => {
                const isSelected = activeBurnWindow === d;
                return (
                  <Pressable
                    key={d}
                    onPress={() => handleSelectBurnWindow(d)}
                    className={`flex-1 py-2 items-center justify-center rounded-lg ${
                      isSelected
                        ? 'bg-white dark:bg-accent-champagne shadow-xs border border-linen-border/40 dark:border-transparent'
                        : 'active:opacity-70'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isSelected
                          ? 'text-linen-text-primary dark:text-black'
                          : 'text-linen-text-secondary dark:text-cypress-text-secondary'
                      }`}
                    >
                      {translate('settings.burnWindow.days', { days: d })}
                    </Text>
                  </Pressable>
                );
              })}
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
            label="Kelola Kategori"
            description="Tambah, ubah, atau hapus kategori transaksi"
            icon={<Tag size={18} color={colors.tint} />}
            isLast
            onPress={() => setIsManageCategoriesOpen(true)}
            action={
              <View className="px-3 py-1 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border">
                <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary">
                  {categories.length} Kategori
                </Text>
              </View>
            }
          />
        </SettingSection>

        {/* 2. APPEARANCE & LANGUAGE */}
        <SettingSection title={translate('settings.sections.appearance')}>
          {/* Theme Mode Selector */}
          <View className="py-3.5 px-4 border-b border-linen-border/70 dark:border-cypress-border/70">
            <View className="flex-row items-center mb-2.5">
              <SunMoon size={18} color={colors.tint} />
              <Text className="text-sm font-semibold text-linen-text-primary dark:text-cypress-text-primary ml-3">
                {translate('settings.theme.title')}
              </Text>
            </View>

            <View className="flex-row p-1 rounded-xl bg-linen-bg dark:bg-cypress-surface border border-linen-border/80 dark:border-cypress-border/80 mb-2">
              {[
                { mode: 'system', label: translate('settings.theme.auto') },
                { mode: 'light', label: translate('settings.theme.light') },
                { mode: 'dark', label: translate('settings.theme.dark') },
              ].map((item) => {
                const isSelected = activeThemeMode === item.mode;
                return (
                  <Pressable
                    key={item.mode}
                    onPress={() => handleSelectTheme(item.mode as any)}
                    className={`flex-1 py-2 items-center justify-center rounded-lg ${
                      isSelected
                        ? 'bg-white dark:bg-accent-champagne shadow-xs border border-linen-border/40 dark:border-transparent'
                        : 'active:opacity-70'
                    }`}
                  >
                    <Text
                      numberOfLines={1}
                      className={`text-xs font-bold ${
                        isSelected
                          ? 'text-linen-text-primary dark:text-black'
                          : 'text-linen-text-secondary dark:text-cypress-text-secondary'
                      }`}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text className="text-[11px] text-linen-text-secondary/90 dark:text-cypress-text-secondary/90 leading-4">
              {activeThemeMode === 'system'
                ? translate('settings.theme.autoHint')
                : activeThemeMode === 'light'
                ? translate('settings.theme.lightHint')
                : translate('settings.theme.darkHint')}
            </Text>
          </View>

          {/* Language Selector */}
          <View className="py-3.5 px-4">
            <View className="flex-row items-center mb-2.5">
              <Globe size={18} color={colors.tint} />
              <Text className="text-sm font-semibold text-linen-text-primary dark:text-cypress-text-primary ml-3">
                {translate('settings.language.title')}
              </Text>
            </View>

            <View className="flex-row p-1 rounded-xl bg-linen-bg dark:bg-cypress-surface border border-linen-border/80 dark:border-cypress-border/80 mb-2">
              {[
                { code: 'auto', label: translate('settings.language.auto') },
                { code: 'id', label: translate('settings.language.id') },
                { code: 'en', label: translate('settings.language.en') },
              ].map((lang) => {
                const isSelected = activeLanguage === lang.code;
                return (
                  <Pressable
                    key={lang.code}
                    onPress={() => handleSelectLanguage(lang.code)}
                    className={`flex-1 py-2 items-center justify-center rounded-lg ${
                      isSelected
                        ? 'bg-white dark:bg-accent-champagne shadow-xs border border-linen-border/40 dark:border-transparent'
                        : 'active:opacity-70'
                    }`}
                  >
                    <Text
                      numberOfLines={1}
                      className={`text-xs font-bold ${
                        isSelected
                          ? 'text-linen-text-primary dark:text-black'
                          : 'text-linen-text-secondary dark:text-cypress-text-secondary'
                      }`}
                    >
                      {lang.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text className="text-[11px] text-linen-text-secondary/90 dark:text-cypress-text-secondary/90 leading-4">
              {activeLanguage === 'auto'
                ? translate('settings.language.autoHint')
                : activeLanguage === 'id'
                ? translate('settings.language.idHint')
                : translate('settings.language.enHint')}
            </Text>
          </View>
        </SettingSection>

        {/* 3. DATA & BACKUP */}
        <SettingSection title={translate('settings.sections.data')}>
          <SettingRow
            label={translate('settings.exportCsv.title')}
            description={translate('settings.exportCsv.desc')}
            icon={<Download size={18} color={colors.tint} />}
            onPress={handleExportCsv}
            action={
              <Pressable
                onPress={handleExportCsv}
                disabled={isExporting}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 dark:bg-accent-champagne/15 border border-emerald-600 dark:border-accent-champagne flex-row items-center active:opacity-70"
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color={colors.tint} />
                ) : (
                  <Text className="text-xs font-bold text-emerald-800 dark:text-accent-champagne">
                    {translate('settings.exportCsv.button')}
                  </Text>
                )}
              </Pressable>
            }
          />

          {exportFeedback && (
            <View className="px-4 py-2 bg-status-safe/10 border-b border-status-safe/20">
              <Text className="text-xs text-status-safe font-semibold text-center">
                {exportFeedback}
              </Text>
            </View>
          )}

          {__DEV__ && (
            <SettingRow
              label={translate('settings.resetDemo.title')}
              description={translate('settings.resetDemo.desc')}
              icon={<RotateCcw size={18} color={colors.tint} />}
              onPress={() => setDangerModal({ visible: true, type: 'reset' })}
              action={
                <View className="px-3 py-1.5 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border">
                  <Text className="text-xs font-bold text-linen-text-secondary dark:text-cypress-text-secondary">
                    {translate('settings.resetDemo.button')}
                  </Text>
                </View>
              }
            />
          )}

          <SettingRow
            label={translate('settings.clearData.title')}
            description={translate('settings.clearData.desc')}
            icon={<Trash2 size={18} color="#EF4444" />}
            isDanger
            isLast
            onPress={() => setDangerModal({ visible: true, type: 'clear' })}
            action={
              <View className="px-3 py-1.5 rounded-xl bg-status-danger/10 border border-status-danger/30">
                <Text className="text-xs font-bold text-status-danger">
                  {translate('settings.clearData.button')}
                </Text>
              </View>
            }
          />
        </SettingSection>

        {/* 4. ABOUT APP */}
        <SettingSection title={translate('settings.sections.about')}>
          <SettingRow
            label={translate('settings.aboutInfo.version')}
            icon={<Info size={18} color={colors.tint} />}
            action={
              <Text className="text-xs font-mono font-bold text-linen-text-secondary dark:text-cypress-text-secondary">
                v1.0.0
              </Text>
            }
          />
          <SettingRow
            label={translate('settings.aboutInfo.storage')}
            description={translate('settings.aboutInfo.storageDesc')}
            icon={<Shield size={18} color={colors.tint} />}
            isLast
            action={
              <View className="px-2.5 py-0.5 rounded-full bg-status-safe/10 border border-status-safe/30">
                <Text className="text-[10px] font-bold text-status-safe uppercase tracking-wider">
                  WAL ON
                </Text>
              </View>
            }
          />
        </SettingSection>
      </ScrollView>

      {/* BOTTOM SHEETS & MODALS */}
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

      <DangerConfirmModal
        visible={dangerModal.visible}
        title={
          dangerModal.type === 'reset'
            ? translate('settings.resetDemo.confirmTitle')
            : translate('settings.clearData.confirmTitle')
        }
        description={
          dangerModal.type === 'reset'
            ? translate('settings.resetDemo.confirmDesc')
            : translate('settings.clearData.confirmDesc')
        }
        confirmLabel={
          dangerModal.type === 'reset'
            ? translate('settings.resetDemo.confirmButton')
            : translate('settings.clearData.confirmButton')
        }
        onConfirm={async () => {
          if (dangerModal.type === 'reset') {
            await resetToDemo();
          } else {
            await clearTransactions();
          }
        }}
        onClose={() => setDangerModal({ visible: false, type: 'reset' })}
      />

      <ManageCategoriesModal
        visible={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
      />
    </View>
  );
}

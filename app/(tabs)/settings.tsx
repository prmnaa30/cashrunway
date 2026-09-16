import React, { useState, useRef, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, Text, ScrollView, Switch, Pressable, ActivityIndicator, Platform } from 'react-native';
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
  Bell,
  BellRing,
  CloudUpload,
  FileSpreadsheet,
  History,
  X,
} from 'lucide-react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useFinanceStore } from '@/store/useFinanceStore';
import { useSettingsStore } from '@/store/useSettingStore';
import { useBackupStore } from '@/store/useBackupStore';
import { formatCurrency, DEFAULT_FALLBACK_BURNS } from '@/lib/format';
import { useTranslation } from '@/lib/i18n';
import { AppSegmentedTabs } from '@/components/ui/AppSegmentedTabs';
import { syncScheduledAlarms } from '@/lib/services/notifications';
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
  ReminderManagerModal,
} from '@/components/settings';
import {
  GoogleAccountCard,
  BackupListSheet,
  ImportCsvSheet,
} from '@/components/backup';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const { t: translate } = useTranslation();
  const scrollViewRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      useBackupStore.getState().initialize().catch(() => {});
    }, [])
  );

  const settings = useFinanceStore((s) => s.settings);
  const transactions = useFinanceStore((s) => s.transactions);
  const categories = useFinanceStore((s) => s.categories);
  const updateSettings = useFinanceStore((s) => s.updateSettings);
  const resetToDemo = useFinanceStore((s) => s.resetToDemo);
  const clearTransactions = useFinanceStore((s) => s.clearTransactions);

  const {
    currency,
    setCurrency,
    themeMode,
    setThemeMode,
    isReminderEnabled,
    reminders,
    toggleReminderEnabled,
    testNotification,
  } = useSettingsStore();

  const {
    isSignedIn,
    isBackingUp,
    createBackup,
    isAutoBackupEnabled,
    toggleAutoBackup,
    lastBackupDate,
    backups,
    feedbackMessage: backupFeedback,
    error: backupError,
    clearFeedback,
  } = useBackupStore();

  // Modals / Sheets state
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [isFallbackBurnOpen, setIsFallbackBurnOpen] = useState(false);
  const [isPaydayOpen, setIsPaydayOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [isReminderModalVisible, setIsReminderModalVisible] = useState(false);
  const [isBackupListOpen, setIsBackupListOpen] = useState(false);
  const [isImportCsvOpen, setIsImportCsvOpen] = useState(false);
  const [dangerModal, setDangerModal] = useState<{
    visible: boolean;
    type: 'reset' | 'clear';
  }>({ visible: false, type: 'reset' });

  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [reminderTestFeedback, setReminderTestFeedback] = useState<string | null>(null);

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
    try {
      const runwayDays = useFinanceStore.getState()?.runway?.operationalRunwayDays || 0;
      await syncScheduledAlarms(reminders, isReminderEnabled, runwayDays);
    } catch (_) {}
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
        ref={scrollViewRef}
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

            <View className="mb-2">
              <AppSegmentedTabs<'system' | 'light' | 'dark'>
                size="sm"
                value={activeThemeMode as any}
                onChange={(mode) => handleSelectTheme(mode)}
                options={[
                  { key: 'system', label: translate('settings.theme.auto') },
                  { key: 'light', label: translate('settings.theme.light') },
                  { key: 'dark', label: translate('settings.theme.dark') },
                ]}
              />
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

            <View className="mb-2">
              <AppSegmentedTabs<string>
                size="sm"
                value={activeLanguage}
                onChange={(lang) => handleSelectLanguage(lang)}
                options={[
                  { key: 'auto', label: translate('settings.language.auto') },
                  { key: 'id', label: translate('settings.language.id') },
                  { key: 'en', label: translate('settings.language.en') },
                ]}
              />
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

        {/* 3. NOTIFIKASI & PENGINGAT */}
        <SettingSection title={translate('settings.sections.notifications')}>
          <SettingRow
            label={translate('settings.reminders.dailyTitle')}
            description={translate('settings.reminders.dailyDesc')}
            icon={<Bell size={18} color={colors.tint} />}
            isLast={!isReminderEnabled}
            action={
              <Switch
                value={isReminderEnabled}
                onValueChange={toggleReminderEnabled}
                trackColor={{ false: isDark ? '#374151' : '#DCE5E0', true: colors.tint }}
                thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
              />
            }
          />

          {isReminderEnabled && (
            <View className="py-3 px-4 border-b border-linen-border/70 dark:border-cypress-border/70">
              <Text className="text-[11px] font-semibold text-linen-text-secondary dark:text-cypress-text-secondary mb-2">
                {translate('settings.reminders.activeSchedule')}
              </Text>

              {reminders.filter((r) => r.isEnabled).length === 0 ? (
                <Text className="text-xs italic text-linen-text-secondary dark:text-cypress-text-secondary mb-3">
                  {translate('settings.reminders.noSchedule')}
                </Text>
              ) : (
                <View className="flex-row flex-wrap gap-1.5 mb-3">
                  {reminders
                    .filter((r) => r.isEnabled)
                    .map((item) => {
                      const isPreadded =
                        item.id === 'rem_morning' ||
                        item.id === 'rem_lunch' ||
                        item.id === 'rem_evening';
                      const labelText =
                        !isPreadded && item.label?.trim()
                          ? `${item.time} - ${item.label}`
                          : item.time;

                      return (
                        <View
                          key={item.id}
                          className="px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-accent-champagne/15 border border-emerald-600/30 dark:border-accent-champagne/30"
                        >
                          <Text className="text-xs font-semibold text-emerald-800 dark:text-accent-champagne tabular-nums">
                            {labelText}
                          </Text>
                        </View>
                      );
                    })}
                </View>
              )}

              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setIsReminderModalVisible(true)}
                  className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border items-center justify-center active:opacity-70"
                >
                  <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary">
                    {translate('settings.reminders.manageButton')}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={async () => {
                    if (isTestingNotification) return;
                    setIsTestingNotification(true);
                    setReminderTestFeedback(null);
                    try {
                      await testNotification();
                      setReminderTestFeedback(translate('settings.reminders.testSuccess'));
                    } catch (err) {
                      console.error(err);
                      setReminderTestFeedback(translate('settings.reminders.testError'));
                    } finally {
                      setIsTestingNotification(false);
                      setTimeout(() => setReminderTestFeedback(null), 4000);
                    }
                  }}
                  disabled={isTestingNotification}
                  className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-emerald-500/30 dark:border-accent-champagne/40 flex-row items-center justify-center active:opacity-70"
                >
                  {isTestingNotification ? (
                    <ActivityIndicator size="small" color={isDark ? '#D4AF37' : '#059669'} />
                  ) : (
                    <>
                      <BellRing size={14} color={isDark ? '#D4AF37' : '#059669'} />
                      <Text
                        className={`text-xs font-bold ml-1.5 ${
                          isDark ? 'text-accent-champagne' : 'text-emerald-700'
                        }`}
                      >
                        {translate('settings.reminders.testButton')}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>

              {reminderTestFeedback && (
                <Text
                  className={`text-[11px] mt-2 text-center font-medium ${
                    isDark ? 'text-accent-champagne' : 'text-emerald-600'
                  }`}
                >
                  {reminderTestFeedback}
                </Text>
              )}
            </View>
          )}
        </SettingSection>

        {/* 4. CADANGAN & SINKRONISASI */}
        <SettingSection title={translate('settings.sections.backup')}>
          <GoogleAccountCard />

          {isSignedIn && (
            <>
              <SettingRow
                label={translate('settings.cloudBackup.title')}
                description={
                  lastBackupDate
                    ? translate('settings.cloudBackup.lastBackup', {
                        time: new Date(lastBackupDate).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        }),
                      })
                    : translate('settings.cloudBackup.desc')
                }
                icon={<CloudUpload size={18} color={colors.tint} />}
                onPress={() => createBackup()}
                action={
                  <Pressable
                    onPress={() => createBackup()}
                    disabled={isBackingUp}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 dark:bg-accent-champagne/15 border border-emerald-600 dark:border-accent-champagne flex-row items-center active:opacity-70"
                  >
                    {isBackingUp ? (
                      <ActivityIndicator size="small" color={colors.tint} />
                    ) : (
                      <Text className="text-xs font-bold text-emerald-800 dark:text-accent-champagne">
                        {translate('settings.cloudBackup.button')}
                      </Text>
                    )}
                  </Pressable>
                }
              />

              <SettingRow
                label={translate('settings.autoBackup.title')}
                description={translate('settings.autoBackup.desc')}
                icon={<History size={18} color={colors.tint} />}
                action={
                  <Switch
                    value={isAutoBackupEnabled}
                    onValueChange={toggleAutoBackup}
                    trackColor={{ false: isDark ? '#374151' : '#DCE5E0', true: colors.tint }}
                    thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
                  />
                }
              />

              <SettingRow
                label={translate('settings.cloudBackup.historyButton')}
                description={translate('backupModals.list.subtitle')}
                icon={<History size={18} color={colors.tint} />}
                onPress={() => setIsBackupListOpen(true)}
                action={
                  <View className="px-3 py-1 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border">
                    <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary">
                      {translate('settings.cloudBackup.filesCount', { count: backups.length })}
                    </Text>
                  </View>
                }
              />
            </>
          )}

          <SettingRow
            label={translate('settings.importCsv.title')}
            description={translate('settings.importCsv.desc')}
            icon={<FileSpreadsheet size={18} color={colors.tint} />}
            onPress={() => setIsImportCsvOpen(true)}
            action={
              <Pressable
                onPress={() => setIsImportCsvOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border active:opacity-70"
              >
                <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary">
                  {translate('settings.importCsv.button')}
                </Text>
              </Pressable>
            }
          />

          <SettingRow
            label={translate('settings.exportCsv.title')}
            description={translate('settings.exportCsv.desc')}
            icon={<Download size={18} color={colors.tint} />}
            isLast
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

          {(backupFeedback || backupError) && (
            <View
              className={`px-4 py-2.5 border-b flex-row items-center justify-between ${
                backupError
                  ? 'bg-status-danger/10 border-status-danger/20'
                  : 'bg-status-safe/10 border-status-safe/20'
              }`}
            >
              <Text
                className={`text-xs font-semibold flex-1 pr-2 ${
                  backupError ? 'text-status-danger' : 'text-status-safe'
                }`}
              >
                {backupError
                  ? backupError.startsWith('settings.')
                    ? translate(backupError)
                    : backupError
                  : backupFeedback
                  ? backupFeedback.startsWith('settings.')
                    ? translate(backupFeedback)
                    : backupFeedback
                  : null}
              </Text>
              <Pressable
                onPress={clearFeedback}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="p-1 rounded-full active:opacity-60"
              >
                <X size={14} color={backupError ? '#EF4444' : colors.tint} />
              </Pressable>
            </View>
          )}
        </SettingSection>

        {/* 5. MANAJEMEN DATA */}
        <SettingSection title={translate('settings.sections.data')}>
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

      <ReminderManagerModal
        visible={isReminderModalVisible}
        onClose={() => setIsReminderModalVisible(false)}
      />

      <BackupListSheet
        visible={isBackupListOpen}
        onClose={() => setIsBackupListOpen(false)}
      />

      <ImportCsvSheet
        visible={isImportCsvOpen}
        onClose={() => setIsImportCsvOpen(false)}
      />
    </View>
  );
}

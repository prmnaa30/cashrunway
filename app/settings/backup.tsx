import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CloudUpload,
  History,
  FileSpreadsheet,
  Download,
  X,
} from 'lucide-react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useFinanceStore } from '@/store/useFinanceStore';
import { useBackupStore } from '@/store/useBackupStore';
import { useTranslation } from '@/lib/i18n';
import { exportAndShareTransactionsCsv } from '@/lib/export/csvExport';
import {
  SettingSection,
  SettingRow,
  SettingsSubHeader,
} from '@/components/settings';
import {
  GoogleAccountCard,
  BackupListSheet,
  ImportCsvSheet,
} from '@/components/backup';

export default function BackupScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t: translate } = useTranslation();

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

  const transactions = useFinanceStore((s) => s.transactions);
  const [isBackupListOpen, setIsBackupListOpen] = useState(false);
  const [isImportCsvOpen, setIsImportCsvOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const handleExportCsv = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportFeedback(translate('settings.exportCsv.exporting'));
    try {
      const result = await exportAndShareTransactionsCsv(transactions);
      if (result.success) {
        setExportFeedback(translate('settings.exportCsv.success'));
      } else {
        setExportFeedback(translate('settings.exportCsv.noData'));
      }
    } catch (_) {
      setExportFeedback(null);
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportFeedback(null), 4000);
    }
  };

  return (
    <View className="flex-1 bg-linen-bg dark:bg-cypress-bg" style={{ paddingTop: insets.top }}>
      <SettingsSubHeader
        title={translate('settings.sections.backup')}
        subtitle={translate('settings.subtitles.backup')}
      />

      <ScrollView
        className="flex-1 px-5 pt-5"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 32 }}
        showsVerticalScrollIndicator={false}
      >
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
                className="px-3 py-1.5 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border flex-row items-center active:opacity-70"
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color={colors.tint} />
                ) : (
                  <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary">
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
      </ScrollView>

      {/* Backup History & CSV Import Sheets */}
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

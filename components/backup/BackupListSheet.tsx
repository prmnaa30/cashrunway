import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Cloud, RotateCcw, Trash2, RefreshCw, Calendar, HardDrive } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useTranslation } from '@/lib/i18n';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { useBackupStore } from '@/store/useBackupStore';
import { GoogleDriveFile } from '@/lib/services/googleDrive';
import { RestoreConfirmModal } from './RestoreConfirmModal';

interface BackupListSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function BackupListSheet({ visible, onClose }: BackupListSheetProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();

  const {
    backups,
    isLoadingBackups,
    loadBackups,
    restoreBackup,
    deleteBackup,
  } = useBackupStore();

  const [selectedBackup, setSelectedBackup] = useState<GoogleDriveFile | null>(null);
  const [isRestoreModalVisible, setIsRestoreModalVisible] = useState(false);

  const handleRestoreClick = (file: GoogleDriveFile) => {
    setSelectedBackup(file);
    setIsRestoreModalVisible(true);
  };

  const handleConfirmRestore = async () => {
    if (!selectedBackup) return;
    const success = await restoreBackup(selectedBackup.id);
    if (success) {
      setIsRestoreModalVisible(false);
      onClose();
    }
  };

  const handleDeleteClick = (file: GoogleDriveFile) => {
    Alert.alert(
      t('backupModals.list.deleteConfirmTitle'),
      t('backupModals.list.deleteConfirmDesc', { name: file.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('backupModals.list.deleteBtn'),
          style: 'destructive',
          onPress: () => deleteBackup(file.id),
        },
      ]
    );
  };

  const formatFileSize = (bytes?: string | number) => {
    if (!bytes) return '1 KB';
    const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (isNaN(num)) return '1 KB';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatFileDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <AppBottomSheet
        visible={visible}
        onClose={onClose}
        title={t('backupModals.list.title')}
        subtitle={t('backupModals.list.subtitle')}
        maxHeight="80%"
      >
        <View className="flex-row justify-end px-4 pt-1 pb-2">
          <Pressable
            onPress={loadBackups}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="flex-row items-center px-3 py-1.5 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border active:opacity-60"
            disabled={isLoadingBackups}
          >
            {isLoadingBackups ? (
              <ActivityIndicator size="small" color={colors.tint} />
            ) : (
              <>
                <RefreshCw size={13} color={colors.textSecondary} />
                <Text className="text-xs font-semibold text-linen-text-secondary dark:text-cypress-text-secondary ml-1.5">
                  Muat Ulang
                </Text>
              </>
            )}
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-4 py-2" showsVerticalScrollIndicator={false}>
          {isLoadingBackups && backups.length === 0 ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color={colors.tint} />
              <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary mt-3">
                {t('common.loading')}
              </Text>
            </View>
          ) : backups.length === 0 ? (
            <View className="py-12 items-center justify-center px-4">
              <View className="w-14 h-14 rounded-full bg-linen-surface dark:bg-cypress-surface items-center justify-center border border-linen-border dark:border-cypress-border mb-3">
                <Cloud size={24} color={colors.textSecondary} />
              </View>
              <Text className="text-sm font-bold text-linen-text-primary dark:text-cypress-text-primary text-center mb-1">
                {t('backupModals.list.emptyTitle')}
              </Text>
              <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary text-center leading-4">
                {t('backupModals.list.emptyDesc')}
              </Text>
            </View>
          ) : (
            <View className="gap-2.5 pb-8">
              {backups.map((file) => (
                <View
                  key={file.id}
                  className="p-3.5 rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border"
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1 pr-2">
                      <Text
                        className="text-xs font-mono font-bold text-linen-text-primary dark:text-cypress-text-primary mb-1"
                        numberOfLines={1}
                      >
                        {file.name}
                      </Text>

                      <View className="flex-row items-center gap-3">
                        <View className="flex-row items-center">
                          <Calendar size={12} color={colors.textSecondary} className="mr-1" />
                          <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary ml-1 tabular-nums">
                            {formatFileDate(file.createdTime || file.modifiedTime)}
                          </Text>
                        </View>

                        <View className="flex-row items-center">
                          <HardDrive size={12} color={colors.textSecondary} className="mr-1" />
                          <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary ml-1 tabular-nums">
                            {formatFileSize(file.size)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row gap-2 mt-1 pt-2 border-t border-linen-border/50 dark:border-cypress-border/50">
                    <Pressable
                      onPress={() => handleRestoreClick(file)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/10 dark:bg-accent-champagne/15 border border-emerald-600/30 dark:border-accent-champagne/30 flex-row items-center justify-center active:opacity-70"
                    >
                      <RotateCcw size={13} color={isDark ? '#D4AF37' : '#059669'} />
                      <Text className="text-xs font-bold text-emerald-800 dark:text-accent-champagne ml-1.5">
                        {t('backupModals.list.restoreBtn')}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleDeleteClick(file)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      className="py-2 px-3 rounded-xl bg-status-danger/10 border border-status-danger/25 items-center justify-center active:opacity-70"
                    >
                      <Trash2 size={13} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </AppBottomSheet>

      <RestoreConfirmModal
        visible={isRestoreModalVisible}
        fileName={selectedBackup?.name}
        onConfirm={handleConfirmRestore}
        onClose={() => setIsRestoreModalVisible(false)}
      />
    </>
  );
}

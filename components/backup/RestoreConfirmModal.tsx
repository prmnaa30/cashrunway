import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { AlertTriangle, RotateCcw } from 'lucide-react-native';
import { AppModal } from '@/components/ui/AppModal';
import { useTranslation } from '@/lib/i18n';
import { useBackupStore } from '@/store/useBackupStore';

interface RestoreConfirmModalProps {
  visible: boolean;
  fileName?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function RestoreConfirmModal({
  visible,
  fileName,
  onConfirm,
  onClose,
}: RestoreConfirmModalProps) {
  const { t } = useTranslation();
  const isRestoring = useBackupStore((s) => s.isRestoring);
  const backupProgress = useBackupStore((s) => s.backupProgress);

  return (
    <AppModal
      visible={visible}
      onClose={isRestoring ? () => {} : onClose}
      showCloseButton={!isRestoring}
      maxWidth={380}
    >
      <View className="items-center mb-3">
        <View className="w-12 h-12 rounded-full bg-status-danger/15 items-center justify-center mb-3 border border-status-danger/30">
          <AlertTriangle size={24} color="#EF4444" />
        </View>

        <Text className="text-base font-black text-linen-text-primary dark:text-cypress-text-primary text-center mb-1">
          {t('backupModals.restore.title')}
        </Text>

        {fileName && (
          <View className="px-2.5 py-1 rounded-lg bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border mb-2">
            <Text className="text-[11px] font-mono text-linen-text-secondary dark:text-cypress-text-secondary">
              {fileName}
            </Text>
          </View>
        )}

        <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary text-center leading-4 mb-2">
          {t('backupModals.restore.warning')}
        </Text>

        <Text className="text-[11px] text-amber-600 dark:text-amber-400 text-center italic leading-4">
          {t('backupModals.restore.safetyNotice')}
        </Text>
      </View>

      {isRestoring ? (
        <View className="py-4 items-center justify-center">
          <ActivityIndicator size="small" color="#EF4444" />
          <Text className="text-xs font-semibold text-linen-text-primary dark:text-cypress-text-primary mt-2">
            {backupProgress?.stage || t('backupModals.restore.progress')}
          </Text>
        </View>
      ) : (
        <View className="flex-row gap-3 mt-3">
          <Pressable
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="flex-1 min-h-[44px] py-3 rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border items-center justify-center active:opacity-70"
          >
            <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary">
              {t('common.cancel')}
            </Text>
          </Pressable>

          <Pressable
            onPress={onConfirm}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="flex-1 min-h-[44px] py-3 rounded-2xl bg-status-danger flex-row items-center justify-center active:opacity-80 shadow-sm"
          >
            <RotateCcw size={14} color="#FFFFFF" className="mr-1.5" />
            <Text className="text-xs font-bold text-white ml-1.5">
              {t('backupModals.restore.confirmButton')}
            </Text>
          </Pressable>
        </View>
      )}
    </AppModal>
  );
}

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { AppModal } from '@/components/ui/AppModal';
import { useTranslation } from '@/lib/i18n';

interface DangerConfirmModalProps {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function DangerConfirmModal({
  visible,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: DangerConfirmModalProps) {
  const { t } = useTranslation();

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      showCloseButton={true}
      maxWidth={380}
    >
      <View className="items-center mb-3">
        <View className="w-12 h-12 rounded-full bg-status-danger/15 items-center justify-center mb-3 border border-status-danger/30">
          <AlertTriangle size={24} color="#EF4444" />
        </View>

        <Text className="text-base font-black text-linen-text-primary dark:text-cypress-text-primary text-center mb-1">
          {title}
        </Text>
        <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary text-center leading-4">
          {description}
        </Text>
      </View>

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
          onPress={() => {
            onConfirm();
            onClose();
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="flex-1 min-h-[44px] py-3 rounded-2xl bg-status-danger items-center justify-center active:opacity-80 shadow-sm"
        >
          <Text className="text-xs font-bold text-white">
            {confirmLabel}
          </Text>
        </Pressable>
      </View>
    </AppModal>
  );
}

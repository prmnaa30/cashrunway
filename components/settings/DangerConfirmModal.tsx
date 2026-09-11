import React from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/60 px-6">
        <Pressable className="absolute inset-0" onPress={onClose} />
        <View className="w-full bg-linen-card dark:bg-cypress-card rounded-2xl border border-linen-border dark:border-cypress-border p-6 shadow-xl">
          <View className="w-12 h-12 rounded-full bg-status-danger/15 items-center justify-center mb-4 self-center border border-status-danger/30">
            <AlertTriangle size={24} color="#EF4444" />
          </View>

          <Text className="text-lg font-bold text-linen-text-primary dark:text-cypress-text-primary text-center mb-2">
            {title}
          </Text>
          <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary text-center mb-6 leading-5">
            {description}
          </Text>

          <View className="flex-row space-x-3">
            <Pressable
              onPress={onClose}
              className="flex-1 py-3 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border items-center justify-center mr-2 active:opacity-70"
            >
              <Text className="text-xs font-semibold text-linen-text-secondary dark:text-cypress-text-secondary">
                {t('common.cancel')}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 py-3 rounded-xl bg-status-danger items-center justify-center ml-2 active:opacity-80"
            >
              <Text className="text-xs font-bold text-white">
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

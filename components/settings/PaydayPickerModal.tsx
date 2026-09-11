import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/lib/i18n';
import { SettingsBottomSheet } from './SettingsBottomSheet';

interface PaydayPickerModalProps {
  visible: boolean;
  currentDay: number;
  onSelect: (day: number) => void;
  onClose: () => void;
}

export function PaydayPickerModal({
  visible,
  currentDay,
  onSelect,
  onClose,
}: PaydayPickerModalProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [selectedDay, setSelectedDay] = useState(currentDay);

  useEffect(() => {
    if (visible) {
      setSelectedDay(currentDay);
    }
  }, [visible, currentDay]);

  const handleConfirm = () => {
    onSelect(selectedDay);
    onClose();
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <SettingsBottomSheet
      visible={visible}
      onClose={onClose}
      title={t('settings.payday.modalTitle')}
      subtitle={t('settings.payday.modalSubtitle')}
      maxHeight="86%"
    >
      <ScrollView
        className="px-5 pt-3"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 28) }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row flex-wrap justify-between">
          {days.map((day) => {
            const isSelected = selectedDay === day;
            return (
              <Pressable
                key={day}
                onPress={() => setSelectedDay(day)}
                className={`w-[13%] aspect-square mb-2.5 items-center justify-center rounded-xl border ${
                  isSelected
                    ? 'bg-cypress-surface dark:bg-accent-champagne border-cypress-surface dark:border-accent-champagne shadow-sm'
                    : 'bg-linen-surface dark:bg-cypress-surface border-linen-border dark:border-cypress-border active:opacity-70'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isSelected
                      ? 'text-white dark:text-black'
                      : 'text-linen-text-primary dark:text-cypress-text-secondary'
                  }`}
                >
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={handleConfirm}
          className="mt-3 w-full py-3.5 rounded-xl bg-cypress-surface dark:bg-accent-champagne items-center justify-center active:opacity-80"
        >
          <Text className="text-sm font-bold text-white dark:text-black">
            {t('common.save')}
          </Text>
        </Pressable>
      </ScrollView>
    </SettingsBottomSheet>
  );
}

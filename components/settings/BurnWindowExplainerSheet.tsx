import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import { useTranslation } from '@/lib/i18n';
import { SettingsBottomSheet } from './SettingsBottomSheet';

interface BurnWindowExplainerSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function BurnWindowExplainerSheet({
  visible,
  onClose,
}: BurnWindowExplainerSheetProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();

  const options = [
    {
      days: 7,
      title: t('settings.burnWindowExplainer.days7.title'),
      desc: t('settings.burnWindowExplainer.days7.desc'),
      pros: t('settings.burnWindowExplainer.days7.pros'),
      cons: t('settings.burnWindowExplainer.days7.cons'),
    },
    {
      days: 14,
      title: t('settings.burnWindowExplainer.days14.title'),
      desc: t('settings.burnWindowExplainer.days14.desc'),
      pros: t('settings.burnWindowExplainer.days14.pros'),
      cons: t('settings.burnWindowExplainer.days14.cons'),
    },
    {
      days: 30,
      title: t('settings.burnWindowExplainer.days30.title'),
      desc: t('settings.burnWindowExplainer.days30.desc'),
      pros: t('settings.burnWindowExplainer.days30.pros'),
      cons: t('settings.burnWindowExplainer.days30.cons'),
    },
  ];

  return (
    <SettingsBottomSheet
      visible={visible}
      onClose={onClose}
      title={t('settings.burnWindowExplainer.title')}
      subtitle={t('settings.burnWindowExplainer.subtitle')}
      maxHeight="86%"
    >
      <ScrollView
        className="px-5 pt-3"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 28) }}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {options.map((opt) => (
          <View
            key={opt.days}
            className="mb-3.5 p-4 rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border"
          >
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-sm font-bold text-linen-text-primary dark:text-cypress-text-primary">
                {opt.title}
              </Text>
              <View className="px-2 py-0.5 rounded-full bg-accent-brass/15 dark:bg-accent-champagne/15 border border-accent-brass dark:border-accent-champagne">
                <Text className="text-[10px] font-bold text-accent-brass dark:text-accent-champagne">
                  {opt.days} Hari
                </Text>
              </View>
            </View>

            <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary leading-4 mb-3">
              {opt.desc}
            </Text>

            <View className="space-y-1.5">
              <View className="flex-row items-start">
                <CheckCircle2
                  size={15}
                  color={isDark ? '#4ADE80' : '#22C55E'}
                  style={{ marginRight: 8, marginTop: 2 }}
                />
                <Text className="text-[11px] text-linen-text-primary dark:text-cypress-text-primary flex-1 leading-4">
                  {opt.pros}
                </Text>
              </View>
              <View className="flex-row items-start mt-1.5">
                <XCircle
                  size={15}
                  color={isDark ? '#F87171' : '#EF4444'}
                  style={{ marginRight: 8, marginTop: 2 }}
                />
                <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary flex-1 leading-4">
                  {opt.cons}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SettingsBottomSheet>
  );
}

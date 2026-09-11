import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/lib/i18n';
import { useColorScheme } from '@/components/useColorScheme';
import { SettingsBottomSheet } from './SettingsBottomSheet';

interface CurrencyPickerModalProps {
  visible: boolean;
  currentCurrency: string;
  onSelect: (currencyCode: string) => void;
  onClose: () => void;
}

const CURRENCY_LIST = [
  { code: 'IDR', label: 'Rupiah Indonesia', symbol: 'Rp' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'SGD', label: 'Singapore Dollar', symbol: 'S$' },
  { code: 'MYR', label: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
];

export function CurrencyPickerModal({
  visible,
  currentCurrency,
  onSelect,
  onClose,
}: CurrencyPickerModalProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'dark';
  const isDark = colorScheme === 'dark';

  return (
    <SettingsBottomSheet
      visible={visible}
      onClose={onClose}
      title={t('settings.currency.modalTitle')}
      subtitle={t('settings.currency.modalSubtitle')}
      maxHeight="86%"
    >
      <ScrollView
        className="px-5 pt-2"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 28) }}
        showsVerticalScrollIndicator={false}
      >
        {CURRENCY_LIST.map((c) => {
          const isSelected = currentCurrency.toUpperCase() === c.code;
          return (
            <Pressable
              key={c.code}
              onPress={() => {
                onSelect(c.code);
                onClose();
              }}
              className={`flex-row items-center justify-between py-3 px-4 rounded-xl mb-2 border ${
                isSelected
                  ? 'bg-white dark:bg-accent-champagne/15 border-linen-border dark:border-accent-champagne shadow-xs'
                  : 'bg-linen-surface dark:bg-cypress-surface border-linen-border dark:border-cypress-border active:opacity-70'
              }`}
            >
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-linen-card dark:bg-cypress-card items-center justify-center mr-3 border border-linen-border dark:border-cypress-border">
                  <Text className="font-mono font-bold text-xs text-accent-brass dark:text-accent-champagne">
                    {c.symbol}
                  </Text>
                </View>
                <View>
                  <Text className="text-sm font-semibold text-linen-text-primary dark:text-cypress-text-primary">
                    {c.label}
                  </Text>
                  <Text className="text-[11px] font-mono text-linen-text-secondary dark:text-cypress-text-secondary">
                    {c.code}
                  </Text>
                </View>
              </View>

              {isSelected && (
                <Check size={18} color={isDark ? '#D4AF37' : '#B8860B'} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </SettingsBottomSheet>
  );
}

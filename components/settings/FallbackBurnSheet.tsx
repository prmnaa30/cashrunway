import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { TrendingDown, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/lib/i18n';
import { useColorScheme } from '@/components/useColorScheme';
import { formatCurrency, DEFAULT_FALLBACK_BURNS } from '@/lib/format';
import { SettingsBottomSheet } from './SettingsBottomSheet';

interface FallbackBurnSheetProps {
  visible: boolean;
  currentBurn: number;
  currency: string;
  onSave: (amount: number) => void;
  onClose: () => void;
}

const PRESET_MAP: Record<string, number[]> = {
  IDR: [30000, 50000, 75000, 100000, 150000],
  USD: [15, 25, 40, 50, 75],
  SGD: [20, 35, 50, 75, 100],
  EUR: [15, 25, 40, 50, 75],
  MYR: [50, 80, 100, 150, 200],
  JPY: [2000, 3500, 5000, 8000, 12000],
  GBP: [12, 20, 35, 45, 60],
  AUD: [20, 35, 50, 75, 100],
};

export function FallbackBurnSheet({
  visible,
  currentBurn,
  currency,
  onSave,
  onClose,
}: FallbackBurnSheetProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'dark';
  const isDark = colorScheme === 'dark';
  const [inputValue, setInputValue] = useState(String(Math.round(currentBurn)));

  useEffect(() => {
    if (visible) {
      setInputValue(String(Math.round(currentBurn)));
    }
  }, [visible, currentBurn]);

  const presets = PRESET_MAP[currency.toUpperCase()] || [
    Math.round((DEFAULT_FALLBACK_BURNS[currency] || 50000) * 0.6),
    DEFAULT_FALLBACK_BURNS[currency] || 50000,
    Math.round((DEFAULT_FALLBACK_BURNS[currency] || 50000) * 1.5),
    Math.round((DEFAULT_FALLBACK_BURNS[currency] || 50000) * 2),
  ];

  const parsedAmount = Math.max(0, parseFloat(inputValue.replace(/[^0-9.]/g, '')) || 0);

  const handleSelectPreset = (amount: number) => {
    setInputValue(String(amount));
  };

  const handleConfirm = () => {
    if (parsedAmount > 0) {
      onSave(parsedAmount);
    }
    onClose();
  };

  return (
    <SettingsBottomSheet
      visible={visible}
      onClose={onClose}
      title={t('settings.fallbackBurn.modalTitle')}
      subtitle={t('settings.fallbackBurn.modalSubtitle')}
      maxHeight="86%"
    >
      <ScrollView
        className="px-5 pt-3"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 28) }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Current Active Baseline Banner */}
        <View className="flex-row items-center justify-between p-3.5 rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border mb-4">
          <View className="flex-row items-center">
            <View className="w-9 h-9 rounded-xl bg-accent-brass/15 dark:bg-accent-champagne/15 items-center justify-center mr-3 border border-accent-brass/30 dark:border-accent-champagne/30">
              <TrendingDown size={18} color={isDark ? '#D4AF37' : '#B8860B'} />
            </View>
            <View>
              <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary font-medium">
                {t('settings.fallbackBurn.title')}
              </Text>
              <Text className="text-base font-mono font-bold text-accent-brass dark:text-accent-champagne">
                {formatCurrency(parsedAmount || currentBurn, { currency })} / hari
              </Text>
            </View>
          </View>
        </View>

        {/* Input Box */}
        <View className="mb-4">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary mb-1.5">
            {t('settings.fallbackBurn.inputPlaceholder')}
          </Text>
          <View className="flex-row items-center px-4 py-3 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border">
            <Text className="text-sm font-bold text-linen-text-secondary dark:text-cypress-text-secondary mr-2">
              {currency}
            </Text>
            <TextInput
              value={inputValue}
              onChangeText={setInputValue}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#888"
              className="flex-1 text-base font-mono font-bold text-linen-text-primary dark:text-cypress-text-primary p-0"
            />
          </View>
        </View>

        {/* Quick Presets */}
        <View className="mb-5">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary mb-2">
            {t('settings.fallbackBurn.presets')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row"
          >
            {presets.map((preset) => {
              const isSelected = parsedAmount === preset;
              return (
                <Pressable
                  key={preset}
                  onPress={() => handleSelectPreset(preset)}
                  className={`px-3.5 py-2 rounded-xl mr-2 border flex-row items-center ${
                    isSelected
                      ? 'bg-cypress-surface dark:bg-accent-champagne border-cypress-surface dark:border-accent-champagne shadow-xs'
                      : 'bg-linen-surface dark:bg-cypress-surface border-linen-border dark:border-cypress-border active:opacity-70'
                  }`}
                >
                  <Text
                    className={`text-xs font-mono font-bold ${
                      isSelected ? 'text-white dark:text-black' : 'text-linen-text-primary dark:text-cypress-text-primary'
                    }`}
                  >
                    {formatCurrency(preset, { currency, decimals: 0 })}
                  </Text>
                  {isSelected && <Check size={13} color={isDark ? '#000' : '#D4AF37'} className="ml-1.5" />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Save Button */}
        <Pressable
          onPress={handleConfirm}
          disabled={parsedAmount <= 0}
          className={`w-full py-3.5 rounded-xl items-center justify-center ${
            parsedAmount > 0
              ? 'bg-cypress-surface dark:bg-accent-champagne active:opacity-80'
              : 'bg-linen-border/40 dark:bg-cypress-surface opacity-50'
          }`}
        >
          <Text className="text-sm font-bold text-white dark:text-black">
            {t('settings.fallbackBurn.save')}
          </Text>
        </Pressable>
      </ScrollView>
    </SettingsBottomSheet>
  );
}

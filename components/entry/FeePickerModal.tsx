import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import { DollarSign, Check } from 'lucide-react-native';
import { AppModal } from '@/components/ui/AppModal';
import Colors from '@/constants/Colors';
import { useTranslation } from '@/lib/i18n';
import { formatCurrency, getCurrencySymbol } from '@/lib/format';
import { useSettingsStore } from '@/store/useSettingStore';

export interface FeePickerModalProps {
  visible: boolean;
  currentFee: number;
  onSelectFee: (fee: number) => void;
  onClose: () => void;
  colorScheme: 'light' | 'dark';
  useNativeModal?: boolean;
}

const DEFAULT_FEE_VALUES = [0, 1000, 2500, 6500];

export function FeePickerModal({
  visible,
  currentFee,
  onSelectFee,
  onClose,
  colorScheme,
  useNativeModal = true,
}: FeePickerModalProps) {
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();
  const currency = useSettingsStore((s) => s.currency);
  const symbol = getCurrencySymbol(currency);
  const [customText, setCustomText] = useState(currentFee > 0 ? String(currentFee) : '');

  useEffect(() => {
    if (visible) {
      setCustomText(currentFee > 0 ? String(currentFee) : '');
    }
  }, [currentFee, visible]);

  const handleSelectPreset = (val: number) => {
    Keyboard.dismiss();
    onSelectFee(val);
    onClose();
  };

  const handleApplyCustom = () => {
    Keyboard.dismiss();
    const parsed = parseInt(customText.replace(/[^0-9]/g, ''), 10);
    onSelectFee(isNaN(parsed) ? 0 : parsed);
    onClose();
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={t('entry.feePickerTitle')}
      subtitle={t('entry.feePickerSubtitle')}
      maxWidth={380}
      useNativeModal={useNativeModal}
    >
      <View className="pt-1">
        {/* Preset Options */}
        <View className="mb-4">
          <Text className="text-xs font-bold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary mb-2">
            {t('entry.popularFeePresets')}
          </Text>
          <View className="space-y-2">
            {DEFAULT_FEE_VALUES.map((val) => {
              const isSelected = currentFee === val;
              const label =
                val === 0
                  ? t('entry.freeFee', { amount: formatCurrency(0, false) })
                  : formatCurrency(val, false);
              return (
                <TouchableOpacity
                  key={val}
                  onPress={() => handleSelectPreset(val)}
                  activeOpacity={0.7}
                  className={"flex-row items-center justify-between p-3.5 rounded-xl border mb-2 " + (
                    isSelected
                      ? 'bg-linen-surface dark:bg-cypress-surface border-accent-brass dark:border-accent-champagne'
                      : 'bg-linen-card dark:bg-cypress-card border-linen-border dark:border-cypress-border active:opacity-70'
                  )}
                >
                  <Text
                    className={"text-xs font-bold " + (
                      isSelected
                        ? 'text-accent-brass dark:text-accent-champagne font-extrabold'
                        : 'text-linen-text-primary dark:text-cypress-text-primary'
                    )}
                  >
                    {label}
                  </Text>
                  {isSelected && (
                    <Check size={16} color={isDark ? '#D4AF37' : '#B8860B'} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Custom Input */}
        <View className="mb-4">
          <Text className="text-xs font-bold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary mb-2">
            {t('entry.customFeeNominal')}
          </Text>
          <View className="flex-row items-center px-3.5 py-2.5 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border">
            <Text className="text-xs font-bold text-linen-text-secondary dark:text-cypress-text-secondary mr-2">
              {symbol}
            </Text>
            <TextInput
              value={customText}
              onChangeText={setCustomText}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              className="flex-1 text-sm font-bold text-linen-text-primary dark:text-cypress-text-primary p-0"
            />
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={handleApplyCustom}
          activeOpacity={0.8}
          className="w-full py-3 rounded-xl bg-cypress-surface dark:bg-accent-champagne items-center justify-center"
        >
          <Text className="text-xs font-bold text-white dark:text-black">
            {t('entry.applyFee')}
          </Text>
        </TouchableOpacity>
      </View>
    </AppModal>
  );
}

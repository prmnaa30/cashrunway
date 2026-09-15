import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import { DollarSign, Check } from 'lucide-react-native';
import { AppModal } from '@/components/ui/AppModal';
import Colors from '@/constants/Colors';

export interface FeePickerModalProps {
  visible: boolean;
  currentFee: number;
  onSelectFee: (fee: number) => void;
  onClose: () => void;
  colorScheme: 'light' | 'dark';
}

const FEE_PRESETS = [
  { label: 'Gratis (Rp 0)', value: 0 },
  { label: 'Rp 1.000', value: 1000 },
  { label: 'Rp 2.500', value: 2500 },
  { label: 'Rp 6.500', value: 6500 },
];

export function FeePickerModal({
  visible,
  currentFee,
  onSelectFee,
  onClose,
  colorScheme,
}: FeePickerModalProps) {
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
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
      title="Biaya Transfer / Admin"
      subtitle="Biaya transaksi antar dompet atau bank"
      maxWidth={380}
    >
      <View className="pt-1">
        {/* Preset Options */}
        <View className="mb-4">
          <Text className="text-xs font-bold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary mb-2">
            Preset Biaya Populer
          </Text>
          <View className="space-y-2">
            {FEE_PRESETS.map((preset) => {
              const isSelected = currentFee === preset.value;
              return (
                <TouchableOpacity
                  key={preset.value}
                  onPress={() => handleSelectPreset(preset.value)}
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
                    {preset.label}
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
            Nominal Kustom
          </Text>
          <View className="flex-row items-center px-3.5 py-2.5 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border">
            <Text className="text-xs font-bold text-linen-text-secondary dark:text-cypress-text-secondary mr-2">
              Rp
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
          className="w-full py-3 rounded-xl bg-cypress-surface dark:bg-accent-champagne items-center justify-center shadow-xs"
        >
          <Text className="text-xs font-bold text-white dark:text-black">
            Gunakan Nominal Ini
          </Text>
        </TouchableOpacity>
      </View>
    </AppModal>
  );
}

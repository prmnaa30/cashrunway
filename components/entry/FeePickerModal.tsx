import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Platform,
  Modal,
  KeyboardAvoidingView,
  StyleSheet,
} from 'react-native';
import { DollarSign, Check, X } from 'lucide-react-native';
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

/**
 * Overlay picker for transfer admin fee (presets and custom) with keyboard awareness and fade animation.
 */
function FeePickerModalComponent({
  visible,
  currentFee,
  onSelectFee,
  onClose,
  colorScheme,
}: FeePickerModalProps) {
  const colors = Colors[colorScheme];
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

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View className="flex-1 justify-center items-center px-5 bg-black/65">
          <TouchableOpacity
            onPress={handleClose}
            activeOpacity={1}
            style={StyleSheet.absoluteFill}
            accessibilityLabel="Tutup"
          />

          <View className="w-full max-w-sm rounded-3xl bg-linen-bg dark:bg-cypress-bg border border-linen-border dark:border-cypress-border p-5 shadow-2xl z-10">
            {/* Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-linen-border/60 dark:border-cypress-border/60">
              <View className="flex-row items-center">
                <DollarSign size={18} color={colors.tint} />
                <Text className="text-base font-black text-linen-text-primary dark:text-cypress-text-primary ml-2">
                  Biaya Admin Transfer
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleClose}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="w-7 h-7 rounded-full bg-linen-surface dark:bg-cypress-card border border-linen-border dark:border-cypress-border items-center justify-center"
              >
                <X size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Quick Presets */}
            <Text className="text-xs font-bold text-linen-text-secondary dark:text-cypress-text-secondary mt-3 mb-2">
              Pilihan Cepat
            </Text>

            <View className="flex-row flex-wrap justify-between mb-4">
              {FEE_PRESETS.map((preset) => {
                const isSelected = currentFee === preset.value;
                return (
                  <TouchableOpacity
                    key={preset.value}
                    activeOpacity={0.75}
                    onPress={() => handleSelectPreset(preset.value)}
                    className={`w-[48%] py-2.5 px-3 mb-2 rounded-xl border flex-row items-center justify-between ${
                      isSelected
                        ? colorScheme === 'dark'
                          ? 'bg-accent-champagne/15 border-accent-champagne'
                          : 'bg-accent-brass/15 border-accent-brass'
                        : 'bg-linen-surface dark:bg-cypress-card border-linen-border/80 dark:border-cypress-border/80'
                    }`}
                  >
                    <Text
                      className={`text-xs font-mono ${
                        isSelected
                          ? colorScheme === 'dark'
                            ? 'text-accent-champagne font-bold'
                            : 'text-accent-brass font-bold'
                          : 'text-linen-text-secondary dark:text-cypress-text-secondary'
                      }`}
                    >
                      {preset.label}
                    </Text>
                    {isSelected && (
                      <Check
                        size={14}
                        color={colorScheme === 'dark' ? '#D4AF37' : '#B8860B'}
                        strokeWidth={2.5}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Fee Input */}
            <Text className="text-xs font-bold text-linen-text-secondary dark:text-cypress-text-secondary mb-2">
              Atau Masukkan Nominal Kustom
            </Text>

            <View className="flex-row items-center px-3.5 py-2.5 rounded-2xl bg-linen-surface dark:bg-cypress-card border border-linen-border dark:border-cypress-border mb-4">
              <Text className="text-xs font-bold text-linen-text-secondary dark:text-cypress-text-secondary mr-2">
                Rp
              </Text>
              <TextInput
                value={customText}
                onChangeText={setCustomText}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                className="flex-1 text-sm font-mono font-bold text-linen-text-primary dark:text-cypress-text-primary py-0"
              />
            </View>

            <TouchableOpacity
              onPress={handleApplyCustom}
              activeOpacity={0.8}
              className="py-3 rounded-2xl bg-accent-brass dark:bg-accent-champagne items-center justify-center shadow-sm"
            >
              <Text className="text-xs font-black text-[#0C1513]">
                Terapkan Biaya
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const FeePickerModal = React.memo(FeePickerModalComponent);

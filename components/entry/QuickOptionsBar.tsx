import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Calendar, AlertTriangle, FileText, DollarSign } from 'lucide-react-native';
import { TransactionMode } from './types';
import Colors from '@/constants/Colors';

export interface QuickOptionsBarProps {
  mode: TransactionMode;
  isYesterday: boolean;
  onToggleYesterday: () => void;
  isOutlier: boolean;
  onToggleOutlier: () => void;
  note: string;
  onChangeNote: (note: string) => void;
  fee: number;
  onChangeFee: (fee: number) => void;
  colorScheme: 'light' | 'dark';
}

const TRANSFER_FEE_PRESETS = [
  { label: 'Rp 0', value: 0 },
  { label: 'Rp 1.000', value: 1000 },
  { label: 'Rp 2.500', value: 2500 },
  { label: 'Rp 6.500', value: 6500 },
];

/**
 * Additional options bar for Quick Entry:
 * - "Kemarin" (H-1 backdate) toggle
 * - "Anomali" (isOutlier = 1) toggle
 * - Note input text field
 * - Transfer fee presets (Transfer mode only)
 */
export function QuickOptionsBar({
  mode,
  isYesterday,
  onToggleYesterday,
  isOutlier,
  onToggleOutlier,
  note,
  onChangeNote,
  fee,
  onChangeFee,
  colorScheme,
}: QuickOptionsBarProps) {
  const colors = Colors[colorScheme];

  return (
    <View className="px-4 mb-2 space-y-2">
      {/* Toggles Row */}
      <View className="flex-row items-center space-x-2">
        {/* Yesterday Toggle */}
        <Pressable
          onPress={onToggleYesterday}
          className={`flex-row items-center px-3 py-1.5 rounded-xl border ${
            isYesterday
              ? colorScheme === 'dark'
                ? 'bg-accent-champagne/15 border-accent-champagne'
                : 'bg-accent-brass/15 border-accent-brass'
              : 'bg-linen-surface dark:bg-cypress-card border-linen-border dark:border-cypress-border'
          }`}
        >
          <Calendar
            size={13}
            color={
              isYesterday
                ? colorScheme === 'dark'
                  ? '#D4AF37'
                  : '#B8860B'
                : colors.textSecondary
            }
          />
          <Text
            className={`text-[11px] ml-1.5 font-semibold ${
              isYesterday
                ? colorScheme === 'dark'
                  ? 'text-accent-champagne'
                  : 'text-accent-brass'
                : 'text-linen-text-secondary dark:text-cypress-text-secondary'
            }`}
          >
            {isYesterday ? 'Kemarin (H-1)' : 'Hari Ini'}
          </Text>
        </Pressable>

        {/* Outlier Toggle (Only for Expense) */}
        {mode === 'expense' && (
          <Pressable
            onPress={onToggleOutlier}
            className={`flex-row items-center px-3 py-1.5 rounded-xl border ${
              isOutlier
                ? 'bg-status-warning/15 border-status-warning'
                : 'bg-linen-surface dark:bg-cypress-card border-linen-border dark:border-cypress-border'
            }`}
          >
            <AlertTriangle
              size={13}
              color={isOutlier ? '#F59E0B' : colors.textSecondary}
            />
            <Text
              className={`text-[11px] ml-1.5 font-semibold ${
                isOutlier
                  ? 'text-status-warning'
                  : 'text-linen-text-secondary dark:text-cypress-text-secondary'
              }`}
            >
              Anomali
            </Text>
          </Pressable>
        )}
      </View>

      {/* Transfer Fee Presets (Only for Transfer) */}
      {mode === 'transfer' && (
        <View className="mt-1">
          <View className="flex-row items-center justify-between mb-1.5">
            <Text className="text-[11px] font-bold text-linen-text-secondary dark:text-cypress-text-secondary">
              Biaya Admin
            </Text>
            <Text className="text-[11px] font-mono text-linen-text-primary dark:text-cypress-text-primary font-bold">
              {fee === 0 ? 'Gratis' : `Rp ${fee.toLocaleString('id-ID')}`}
            </Text>
          </View>
          <View className="flex-row space-x-1.5">
            {TRANSFER_FEE_PRESETS.map((preset) => {
              const isSelected = fee === preset.value;
              return (
                <Pressable
                  key={preset.value}
                  onPress={() => onChangeFee(preset.value)}
                  className={`flex-1 py-1.5 rounded-xl border items-center justify-center ${
                    isSelected
                      ? colorScheme === 'dark'
                        ? 'bg-accent-champagne/15 border-accent-champagne'
                        : 'bg-accent-brass/15 border-accent-brass'
                      : 'bg-linen-surface dark:bg-cypress-card border-linen-border dark:border-cypress-border'
                  }`}
                >
                  <Text
                    className={`text-[11px] font-mono ${
                      isSelected
                        ? colorScheme === 'dark'
                          ? 'text-accent-champagne font-bold'
                          : 'text-accent-brass font-bold'
                        : 'text-linen-text-secondary dark:text-cypress-text-secondary'
                    }`}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Note Input */}
      <View className="flex-row items-center px-3 py-1.5 rounded-xl bg-linen-surface dark:bg-cypress-card border border-linen-border dark:border-cypress-border mt-1">
        <FileText size={14} color={colors.textSecondary} />
        <TextInput
          value={note}
          onChangeText={onChangeNote}
          placeholder="Catatan / keterangan (opsional)..."
          placeholderTextColor={colorScheme === 'dark' ? '#52665E' : '#8DA499'}
          className="flex-1 ml-2 text-xs text-linen-text-primary dark:text-cypress-text-primary py-0.5"
          maxLength={100}
        />
      </View>
    </View>
  );
}

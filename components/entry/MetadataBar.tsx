import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  Wallet as WalletIcon,
  Calendar,
  AlertTriangle,
  FileText,
  DollarSign,
  ArrowRight,
  ChevronDown,
} from 'lucide-react-native';
import { Wallet, Category } from '@/lib/db';
import { TransactionMode } from './types';
import { formatCurrency } from '@/lib/format';
import { formatLocalDate } from '@/lib/engine/dateUtils';
import { useTranslation } from '@/lib/i18n';
import Colors, { Palette } from '@/constants/Colors';

export interface MetadataBarProps {
  mode: TransactionMode;
  wallet: Wallet | null;
  targetWallet: Wallet | null;
  category: Category | null;
  selectedDate: string;
  isOutlier: boolean;
  note: string;
  fee: number;
  onOpenWalletPicker: () => void;
  onOpenTargetWalletPicker: () => void;
  onOpenCategoryPicker: () => void;
  onOpenDatePicker: () => void;
  onToggleOutlier: () => void;
  onOpenFeePicker: () => void;
  onOpenNoteInput: () => void;
  colorScheme: 'light' | 'dark';
}

/**
 * Clean action chips bar styled with NativeWind Tailwind utility classes.
 * Uses TouchableOpacity with activeOpacity for smooth tactile feedback.
 */
function MetadataBarComponent({
  mode,
  wallet,
  targetWallet,
  category,
  selectedDate,
  isOutlier,
  note,
  fee,
  onOpenWalletPicker,
  onOpenTargetWalletPicker,
  onOpenCategoryPicker,
  onOpenDatePicker,
  onToggleOutlier,
  onOpenFeePicker,
  onOpenNoteInput,
  colorScheme,
}: MetadataBarProps) {
  const { t, locale } = useTranslation();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme];
  const todayStr = formatLocalDate(new Date());

  let dateLabel = t('entry.today');
  if (selectedDate !== todayStr) {
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, monthIdx, day);
      const monthName = dateObj.toLocaleDateString(locale === 'en' ? 'en-US' : 'id-ID', { month: 'short' });
      dateLabel = `${day} ${monthName}`;
    } else {
      dateLabel = selectedDate;
    }
  }

  const baseRow1ChipClass =
    'h-11 min-h-[44px] px-3.5 rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border flex-row items-center justify-between';

  const baseChipClass =
    'bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border';

  return (
    <View className="px-4 py-1 gap-2">
      {/* Row 1: Wallet & Category (or Source -> Target for Transfer) */}
      <View className="flex-row items-center gap-2">
        {mode === 'transfer' ? (
          <View className="flex-1 flex-row items-center gap-1.5">
            {/* Source Wallet */}
            <TouchableOpacity
              onPress={onOpenWalletPicker}
              activeOpacity={0.7}
              className={`flex-1 ${baseRow1ChipClass}`}
            >
              <View className="flex-1 flex-row items-center mr-1">
                <WalletIcon size={16} color={colors.tint} />
                <Text
                  className="text-xs font-bold ml-2 flex-1 text-linen-text-primary dark:text-cypress-text-primary"
                  numberOfLines={1}
                >
                  {wallet?.name ?? t('entry.from')}
                </Text>
              </View>
              <ChevronDown size={13} color={colors.textSecondary} />
            </TouchableOpacity>

            <ArrowRight size={13} color={colors.textSecondary} />

            {/* Target Wallet */}
            <TouchableOpacity
              onPress={onOpenTargetWalletPicker}
              activeOpacity={0.7}
              className={`flex-1 ${baseRow1ChipClass}`}
            >
              <View className="flex-1 flex-row items-center mr-1">
                <WalletIcon
                  size={16}
                  color={isDark ? Palette.champagneGold : Palette.burnishedBrass}
                />
                <Text
                  className="text-xs font-bold ml-2 flex-1 text-linen-text-primary dark:text-cypress-text-primary"
                  numberOfLines={1}
                >
                  {targetWallet?.name ?? t('entry.to')}
                </Text>
              </View>
              <ChevronDown size={13} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Wallet Chip */}
            <TouchableOpacity
              onPress={onOpenWalletPicker}
              activeOpacity={0.7}
              className={`flex-1 ${baseRow1ChipClass}`}
            >
              <View className="flex-1 flex-row items-center mr-1">
                <WalletIcon size={16} color={colors.tint} />
                <Text
                  className="text-xs font-bold ml-2 flex-1 text-linen-text-primary dark:text-cypress-text-primary"
                  numberOfLines={1}
                >
                  {wallet?.name ?? t('entry.selectWallet')}
                </Text>
              </View>
              <ChevronDown size={13} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Category Chip */}
            <TouchableOpacity
              onPress={onOpenCategoryPicker}
              activeOpacity={0.7}
              className={`flex-1 ${baseRow1ChipClass}`}
            >
              <View className="flex-1 flex-row items-center mr-1">
                <Text className="text-base mr-1.5">{category?.icon ?? '🏷️'}</Text>
                <Text
                  className="text-xs font-bold ml-1 flex-1 text-linen-text-primary dark:text-cypress-text-primary"
                  numberOfLines={1}
                >
                  {category?.name ?? t('entry.selectCategory')}
                </Text>
              </View>
              <ChevronDown size={13} color={colors.textSecondary} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Row 2: Date, Outlier (or Fee), and Note */}
      <View className="flex-row items-center gap-2">
        {/* Date Chip */}
        <TouchableOpacity
          onPress={onOpenDatePicker}
          activeOpacity={0.7}
          className={`flex-row items-center py-2 px-2.5 rounded-2xl ${baseChipClass}`}
        >
          <Calendar size={13} color={colors.tint} />
          <Text className="text-xs font-bold ml-1.5 text-linen-text-primary dark:text-cypress-text-primary">
            {dateLabel}
          </Text>
          <ChevronDown size={12} color={colors.textSecondary} className="ml-1" />
        </TouchableOpacity>

        {/* Transfer Fee Chip (Transfer Mode) */}
        {mode === 'transfer' && (
          <TouchableOpacity
            onPress={onOpenFeePicker}
            activeOpacity={0.7}
            className={`flex-row items-center py-2 px-2.5 rounded-2xl ${baseChipClass}`}
          >
            <DollarSign size={13} color={colors.tint} />
            <Text className="text-xs font-bold font-mono ml-1.5 text-linen-text-primary dark:text-cypress-text-primary">
              {fee === 0 ? t('entry.adminFeeZero') : t('entry.adminFee', { amount: formatCurrency(fee, false) })}
            </Text>
            <ChevronDown size={12} color={colors.textSecondary} className="ml-1" />
          </TouchableOpacity>
        )}

        {/* Outlier Chip (Expense Mode Only) */}
        {mode === 'expense' && (
          <TouchableOpacity
            onPress={onToggleOutlier}
            activeOpacity={0.7}
            className={`flex-row items-center py-2 px-2.5 rounded-2xl border ${
              isOutlier
                ? 'bg-status-warning/15 border-status-warning'
                : 'bg-linen-surface dark:bg-cypress-surface border-linen-border dark:border-cypress-border'
            }`}
          >
            <AlertTriangle
              size={13}
              color={isOutlier ? Palette.warning : colors.textSecondary}
            />
            <Text
              className={`text-xs ml-1.5 ${
                isOutlier
                  ? 'font-extrabold text-status-warning'
                  : 'font-bold text-linen-text-secondary dark:text-cypress-text-secondary'
              }`}
            >
              {isOutlier ? t('entry.anomaly') : t('entry.normal')}
            </Text>
          </TouchableOpacity>
        )}

        {/* Note Chip */}
        <TouchableOpacity
          onPress={onOpenNoteInput}
          activeOpacity={0.7}
          className={`flex-1 flex-row items-center py-2 px-2.5 rounded-2xl ${baseChipClass}`}
        >
          <FileText size={13} color={note ? colors.tint : colors.textSecondary} />
          <Text
            className={`text-xs ml-1.5 flex-1 ${
              note
                ? 'font-bold text-linen-text-primary dark:text-cypress-text-primary'
                : 'italic text-linen-text-secondary dark:text-cypress-text-secondary'
            }`}
            numberOfLines={1}
          >
            {note ? note : t('entry.notePlaceholder')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export const MetadataBar = React.memo(MetadataBarComponent);

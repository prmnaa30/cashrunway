import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import { Calendar as CalendarIcon, Check, X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { formatLocalDate, parseLocalDate, addDays, getDaysInMonth } from '@/lib/engine/dateUtils';
import Colors from '@/constants/Colors';

export interface DatePickerModalProps {
  visible: boolean;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  onClose: () => void;
  colorScheme: 'light' | 'dark';
}

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * Overlay date picker with 30-day quick list and arbitrary past date selector with smooth fade animation.
 */
function DatePickerModalComponent({
  visible,
  selectedDate,
  onSelectDate,
  onClose,
  colorScheme,
}: DatePickerModalProps) {
  const colors = Colors[colorScheme];
  const today = new Date();
  const todayStr = formatLocalDate(today);

  const [activeTab, setActiveTab] = useState<'recent' | 'custom'>('recent');

  const parsedCurrent = parseLocalDate(selectedDate || todayStr);
  const [customDay, setCustomDay] = useState<number>(parsedCurrent.getDate());
  const [customMonth, setCustomMonth] = useState<number>(parsedCurrent.getMonth() + 1);
  const [customYear, setCustomYear] = useState<number>(parsedCurrent.getFullYear());

  const recentDays = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => {
      const d = addDays(today, -i);
      const dateStr = formatLocalDate(d);
      const dayName = DAY_NAMES[d.getDay()];
      const dayNum = d.getDate();
      const monthName = MONTH_NAMES[d.getMonth()].slice(0, 3);
      const isToday = i === 0;
      const isYesterday = i === 1;

      let tag = '';
      if (isToday) tag = 'Hari Ini';
      else if (isYesterday) tag = 'Kemarin';
      else tag = `H-${i}`;

      return {
        dateStr,
        label: `${dayName}, ${dayNum} ${monthName}`,
        tag,
        date: d,
      };
    });
  }, [todayStr]);

  const handleApplyCustom = () => {
    const maxDays = getDaysInMonth(customYear, customMonth);
    const validDay = Math.min(customDay, maxDays);
    const m = String(customMonth).padStart(2, '0');
    const d = String(validDay).padStart(2, '0');
    const resultStr = `${customYear}-${m}-${d}`;
    onSelectDate(resultStr);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center px-5 bg-black/65">
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Tutup"
        />

        <View className="w-full max-w-sm rounded-3xl bg-linen-bg dark:bg-cypress-bg border border-linen-border dark:border-cypress-border p-5 shadow-2xl z-10 max-h-[85%]">
        {/* Header */}
        <View className="flex-row items-center justify-between pb-3 border-b border-linen-border/60 dark:border-cypress-border/60">
          <View className="flex-row items-center">
            <CalendarIcon size={18} color={colors.tint} />
            <Text className="text-base font-black text-linen-text-primary dark:text-cypress-text-primary ml-2">
              Pilih Tanggal Transaksi
            </Text>
          </View>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-7 h-7 rounded-full bg-linen-surface dark:bg-cypress-card border border-linen-border dark:border-cypress-border items-center justify-center"
          >
            <X size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View className="flex-row rounded-xl bg-linen-surface dark:bg-cypress-card border border-linen-border dark:border-cypress-border p-1 my-3">
          <TouchableOpacity
            onPress={() => setActiveTab('recent')}
            activeOpacity={0.8}
            className={`flex-1 py-1.5 rounded-lg items-center ${
              activeTab === 'recent'
                ? 'bg-linen-card dark:bg-cypress-surface shadow-xs'
                : 'opacity-60'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === 'recent'
                  ? 'text-linen-text-primary dark:text-cypress-text-primary'
                  : 'text-linen-text-secondary dark:text-cypress-text-secondary'
              }`}
            >
              30 Hari Terakhir
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('custom')}
            activeOpacity={0.8}
            className={`flex-1 py-1.5 rounded-lg items-center ${
              activeTab === 'custom'
                ? 'bg-linen-card dark:bg-cypress-surface shadow-xs'
                : 'opacity-60'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === 'custom'
                  ? 'text-linen-text-primary dark:text-cypress-text-primary'
                  : 'text-linen-text-secondary dark:text-cypress-text-secondary'
              }`}
            >
              Pilih Tanggal Bebas
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'recent' ? (
          /* Scrollable list of last 30 days */
          <ScrollView
            className="max-h-72"
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            {recentDays.map((item) => {
              const isSelected = item.dateStr === selectedDate;
              return (
                <TouchableOpacity
                  key={item.dateStr}
                  activeOpacity={0.75}
                  onPress={() => {
                    onSelectDate(item.dateStr);
                    onClose();
                  }}
                  className={`flex-row items-center justify-between p-3 mb-2 rounded-2xl border ${
                    isSelected
                      ? colorScheme === 'dark'
                        ? 'bg-accent-champagne/15 border-accent-champagne'
                        : 'bg-accent-brass/15 border-accent-brass'
                      : 'bg-linen-surface dark:bg-cypress-card border-linen-border/80 dark:border-cypress-border/80'
                  }`}
                >
                  <View className="flex-row items-center">
                    <View
                      className={`px-2 py-0.5 rounded-md mr-2.5 ${
                        isSelected
                          ? colorScheme === 'dark'
                            ? 'bg-accent-champagne/25'
                            : 'bg-accent-brass/25'
                          : 'bg-linen-card dark:bg-cypress-surface'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          isSelected
                            ? colorScheme === 'dark'
                              ? 'text-accent-champagne'
                              : 'text-accent-brass'
                            : 'text-linen-text-secondary dark:text-cypress-text-secondary'
                        }`}
                      >
                        {item.tag}
                      </Text>
                    </View>
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected
                          ? colorScheme === 'dark'
                            ? 'text-accent-champagne font-bold'
                            : 'text-accent-brass font-bold'
                          : 'text-linen-text-primary dark:text-cypress-text-primary'
                      }`}
                    >
                      {item.label}
                    </Text>
                  </View>

                  {isSelected && (
                    <View
                      className={`w-5 h-5 rounded-full items-center justify-center ${
                        colorScheme === 'dark'
                          ? 'bg-accent-champagne'
                          : 'bg-accent-brass'
                      }`}
                    >
                      <Check size={12} color="#0C1513" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          /* Custom Stepper Selector */
          <View className="py-2">
            <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary text-center mb-4">
              Atur tanggal transaksi di masa lampau:
            </Text>

            {/* Day, Month, Year pickers */}
            <View className="flex-row items-center justify-around mb-5">
              {/* Date */}
              <View className="items-center">
                <Text className="text-[11px] font-bold text-linen-text-secondary dark:text-cypress-text-secondary mb-1">
                  Tanggal
                </Text>
                <View className="flex-row items-center rounded-2xl bg-linen-surface dark:bg-cypress-card border border-linen-border dark:border-cypress-border p-1">
                  <TouchableOpacity
                    onPress={() => setCustomDay((prev) => (prev > 1 ? prev - 1 : 31))}
                    activeOpacity={0.7}
                    className="w-8 h-8 rounded-xl items-center justify-center"
                  >
                    <ChevronLeft size={16} color={colors.text} />
                  </TouchableOpacity>
                  <Text className="w-8 text-center text-base font-black font-mono text-linen-text-primary dark:text-cypress-text-primary">
                    {customDay}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setCustomDay((prev) => (prev < 31 ? prev + 1 : 1))}
                    activeOpacity={0.7}
                    className="w-8 h-8 rounded-xl items-center justify-center"
                  >
                    <ChevronRight size={16} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Month */}
              <View className="items-center">
                <Text className="text-[11px] font-bold text-linen-text-secondary dark:text-cypress-text-secondary mb-1">
                  Bulan
                </Text>
                <View className="flex-row items-center rounded-2xl bg-linen-surface dark:bg-cypress-card border border-linen-border dark:border-cypress-border p-1">
                  <TouchableOpacity
                    onPress={() => setCustomMonth((prev) => (prev > 1 ? prev - 1 : 12))}
                    activeOpacity={0.7}
                    className="w-8 h-8 rounded-xl items-center justify-center"
                  >
                    <ChevronLeft size={16} color={colors.text} />
                  </TouchableOpacity>
                  <Text className="w-12 text-center text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary">
                    {MONTH_NAMES[customMonth - 1].slice(0, 3)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setCustomMonth((prev) => (prev < 12 ? prev + 1 : 1))}
                    activeOpacity={0.7}
                    className="w-8 h-8 rounded-xl items-center justify-center"
                  >
                    <ChevronRight size={16} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Year */}
              <View className="items-center">
                <Text className="text-[11px] font-bold text-linen-text-secondary dark:text-cypress-text-secondary mb-1">
                  Tahun
                </Text>
                <View className="flex-row items-center rounded-2xl bg-linen-surface dark:bg-cypress-card border border-linen-border dark:border-cypress-border p-1">
                  <TouchableOpacity
                    onPress={() => setCustomYear((prev) => prev - 1)}
                    activeOpacity={0.7}
                    className="w-8 h-8 rounded-xl items-center justify-center"
                  >
                    <ChevronLeft size={16} color={colors.text} />
                  </TouchableOpacity>
                  <Text className="w-12 text-center text-xs font-bold font-mono text-linen-text-primary dark:text-cypress-text-primary">
                    {customYear}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setCustomYear((prev) => prev + 1)}
                    activeOpacity={0.7}
                    className="w-8 h-8 rounded-xl items-center justify-center"
                  >
                    <ChevronRight size={16} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleApplyCustom}
              activeOpacity={0.8}
              className="py-3.5 rounded-2xl bg-accent-brass dark:bg-accent-champagne items-center justify-center shadow-sm"
            >
              <Text className="text-xs font-black text-[#0C1513]">
                Gunakan Tanggal Ini
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  </Modal>
);
}

export const DatePickerModal = React.memo(DatePickerModalComponent);

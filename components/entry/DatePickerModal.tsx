import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { formatLocalDate, parseLocalDate, addDays, getDaysInMonth } from '@/lib/engine/dateUtils';
import { AppModal } from '@/components/ui/AppModal';
import { AppSegmentedTabs } from '@/components/ui/AppSegmentedTabs';
import Colors from '@/constants/Colors';
import { useTranslation } from '@/lib/i18n';

export interface DatePickerModalProps {
  visible: boolean;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  onClose: () => void;
  colorScheme: 'light' | 'dark';
  useNativeModal?: boolean;
}

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function DatePickerModal({
  visible,
  selectedDate,
  onSelectDate,
  onClose,
  colorScheme,
  useNativeModal = true,
}: DatePickerModalProps) {
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t, locale } = useTranslation();
  const today = new Date();
  const todayStr = formatLocalDate(today);

  const monthNames = locale === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_ID;
  const dayNames = locale === 'en' ? DAY_NAMES_EN : DAY_NAMES_ID;

  const [activeTab, setActiveTab] = useState<'recent' | 'custom'>('recent');

  const parsedCurrent = parseLocalDate(selectedDate || todayStr);
  const [customDay, setCustomDay] = useState<number>(parsedCurrent.getDate());
  const [customMonth, setCustomMonth] = useState<number>(parsedCurrent.getMonth() + 1);
  const [customYear, setCustomYear] = useState<number>(parsedCurrent.getFullYear());

  const recentDays = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => {
      const d = addDays(today, -i);
      const dateStr = formatLocalDate(d);
      const dayName = dayNames[d.getDay()];
      const dayNum = d.getDate();
      const monthName = monthNames[d.getMonth()].slice(0, 3);
      const isToday = i === 0;
      const isYesterday = i === 1;

      let label = `${dayName}, ${dayNum} ${monthName}`;
      if (isToday) label = `${t('entry.today')} (${dayNum} ${monthName})`;
      if (isYesterday) label = `${t('entry.yesterday')} (${dayNum} ${monthName})`;

      return { dateStr, label, isToday };
    });
  }, [dayNames, monthNames, t]);

  const daysInCustomMonth = useMemo(() => {
    return getDaysInMonth(customYear, customMonth);
  }, [customYear, customMonth]);

  const handlePrevMonth = () => {
    if (customMonth === 1) {
      setCustomMonth(12);
      setCustomYear(customYear - 1);
    } else {
      setCustomMonth(customMonth - 1);
    }
  };

  const handleNextMonth = () => {
    const isFuture =
      customYear > today.getFullYear() ||
      (customYear === today.getFullYear() && customMonth >= today.getMonth() + 1);
    if (isFuture) return;

    if (customMonth === 12) {
      setCustomMonth(1);
      setCustomYear(customYear + 1);
    } else {
      setCustomMonth(customMonth + 1);
    }
  };

  const handleApplyCustomDate = () => {
    const safeDay = Math.min(customDay, daysInCustomMonth);
    const mm = String(customMonth).padStart(2, '0');
    const dd = String(safeDay).padStart(2, '0');
    const dateStr = `${customYear}-${mm}-${dd}`;
    onSelectDate(dateStr);
    onClose();
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={t('entry.datePickerTitle')}
      maxWidth={400}
      useNativeModal={useNativeModal}
    >
      {/* Segmented Switcher */}
      <View className="mb-3">
        <AppSegmentedTabs<'recent' | 'custom'>
          value={activeTab}
          onChange={setActiveTab}
          size="sm"
          options={[
            { key: 'recent', label: t('entry.tabRecentDays') },
            { key: 'custom', label: t('entry.tabCustomDate') },
          ]}
        />
      </View>

      {/* Tab: 30 Hari Terakhir */}
      {activeTab === 'recent' && (
        <ScrollView className="max-h-72" showsVerticalScrollIndicator={false}>
          {recentDays.map((item) => {
            const isSelected = item.dateStr === selectedDate;
            return (
              <TouchableOpacity
                key={item.dateStr}
                onPress={() => {
                  onSelectDate(item.dateStr);
                  onClose();
                }}
                activeOpacity={0.7}
                className={"flex-row items-center justify-between p-3 rounded-xl mb-1.5 border " + (
                  isSelected
                    ? 'bg-linen-surface dark:bg-cypress-surface border-accent-brass dark:border-accent-champagne'
                    : 'bg-linen-card dark:bg-cypress-card border-linen-border/60 dark:border-cypress-border/60 active:opacity-70'
                )}
              >
                <Text
                  className={"text-xs font-bold " + (
                    isSelected
                      ? 'text-accent-brass dark:text-accent-champagne font-extrabold'
                      : 'text-linen-text-primary dark:text-cypress-text-primary'
                  )}
                >
                  {item.label}
                </Text>

                {isSelected && (
                  <Check size={16} color={isDark ? '#D4AF37' : '#B8860B'} strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Tab: Custom Date Calendar Picker */}
      {activeTab === 'custom' && (
        <View className="pt-1">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <TouchableOpacity
              onPress={handlePrevMonth}
              className="w-9 h-9 rounded-full bg-linen-surface dark:bg-cypress-surface items-center justify-center border border-linen-border dark:border-cypress-border"
            >
              <ChevronLeft size={16} color={colors.text} />
            </TouchableOpacity>

            <Text className="text-sm font-bold text-linen-text-primary dark:text-cypress-text-primary">
              {monthNames[customMonth - 1]} {customYear}
            </Text>

            <TouchableOpacity
              onPress={handleNextMonth}
              className="w-9 h-9 rounded-full bg-linen-surface dark:bg-cypress-surface items-center justify-center border border-linen-border dark:border-cypress-border"
            >
              <ChevronRight size={16} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView className="max-h-56" showsVerticalScrollIndicator={false}>
            <View className="flex-row flex-wrap justify-start">
              {Array.from({ length: daysInCustomMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected = customDay === dayNum;
                return (
                  <View key={dayNum} style={{ width: '14.28%', padding: 2 }}>
                    <TouchableOpacity
                      onPress={() => setCustomDay(dayNum)}
                      className={"aspect-square items-center justify-center rounded-xl border " + (
                        isSelected
                          ? 'bg-cypress-surface dark:bg-accent-champagne border-cypress-surface dark:border-accent-champagne'
                          : 'bg-linen-surface dark:bg-cypress-surface border-linen-border dark:border-cypress-border'
                      )}
                    >
                      <Text
                        className={"text-xs font-bold " + (
                          isSelected
                            ? 'text-white dark:text-black font-extrabold'
                            : 'text-linen-text-primary dark:text-cypress-text-primary'
                        )}
                      >
                        {dayNum}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <TouchableOpacity
            onPress={handleApplyCustomDate}
            activeOpacity={0.8}
            className="mt-3 py-3 rounded-xl bg-cypress-surface dark:bg-accent-champagne items-center justify-center"
          >
            <Text className="text-xs font-bold text-white dark:text-black">
              {t('entry.applyDate')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </AppModal>
  );
}

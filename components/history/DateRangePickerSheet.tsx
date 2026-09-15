import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { ChevronLeft, ChevronRight, Check } from "lucide-react-native";
import { AppBottomSheet } from "@/components/ui/AppBottomSheet";
import { useTranslation } from "@/lib/i18n";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export {
  type QuickRangeKey,
  getMonthRange,
  getCurrentMonthRange,
  getLastMonthRange,
  getQuickDateRange,
  detectRangeMode,
} from "@/lib/utils/dateRange";
import {
  type QuickRangeKey,
  getMonthRange,
  getQuickDateRange,
  detectRangeMode,
} from "@/lib/utils/dateRange";

interface DateRangePickerSheetProps {
  visible: boolean;
  currentRange: { start: string; end: string };
  onClose: () => void;
  onSelectRange: (range: { start: string; end: string }) => void;
}

export function DateRangePickerSheet({
  visible,
  currentRange,
  onClose,
  onSelectRange,
}: DateRangePickerSheetProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];

  const [selectedPreset, setSelectedPreset] = useState<QuickRangeKey>("thisMonth");
  const [localRange, setLocalRange] = useState(currentRange);

  useEffect(() => {
    if (visible) {
      setLocalRange(currentRange);
      setSelectedPreset(detectRangeMode(currentRange));
    }
  }, [visible, currentRange]);

  const handleApply = () => {
    onSelectRange(localRange);
    onClose();
  };

  const handleSelectPreset = (key: QuickRangeKey) => {
    setSelectedPreset(key);
    setLocalRange(getQuickDateRange(key));
  };

  const getMonthLabel = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const m = d.toLocaleString("default", { month: "short" });
    return `${m} ${d.getFullYear()}`;
  };

  const adjustDate = (dateStr: string, offset: number, isStart: boolean) => {
    const d = new Date(dateStr + "T00:00:00");
    d.setMonth(d.getMonth() + offset);
    const range = getMonthRange(d.getFullYear(), d.getMonth());
    return isStart ? range.start : range.end;
  };

  const setStartMonthOffset = (offset: number) => {
    setSelectedPreset("custom");
    const newStart = adjustDate(localRange.start, offset, true);
    if (newStart > localRange.end) return; // Prevent start > end
    setLocalRange({ ...localRange, start: newStart });
  };

  const setEndMonthOffset = (offset: number) => {
    setSelectedPreset("custom");
    const newEnd = adjustDate(localRange.end, offset, false);
    if (localRange.start > newEnd) return; // Prevent start > end
    setLocalRange({ ...localRange, end: newEnd });
  };

  const quickOptions: Array<{ key: QuickRangeKey; label: string }> = [
    { key: "all", label: t("history.quickAll") },
    { key: "today", label: t("history.quickToday") },
    { key: "yesterday", label: t("history.quickYesterday") },
    { key: "thisWeek", label: t("history.quickThisWeek") },
    { key: "lastWeek", label: t("history.quickLastWeek") },
    { key: "thisMonth", label: t("history.quickThisMonth") },
    { key: "lastMonth", label: t("history.quickLastMonth") },
    { key: "thisYear", label: t("history.quickThisYear") },
    { key: "lastYear", label: t("history.quickLastYear") },
    { key: "last7Days", label: t("history.quickLast7Days") },
    { key: "last30Days", label: t("history.quickLast30Days") },
    { key: "last90Days", label: t("history.quickLast90Days") },
  ];

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title={t("history.rangePickerTitle")}
      subtitle={t("history.rangePickerSubtitle")}
      maxHeight="86%"
    >
      <ScrollView
        className="px-5 pt-3 pb-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        {/* Quick Date Range Section Header */}
        <Text className="text-[11px] font-bold text-linen-text-secondary dark:text-cypress-text-secondary mb-2 uppercase tracking-wider">
          {t("history.quickDateRange")}
        </Text>

        {/* Quick Presets List */}
        <View className="rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border divide-y divide-linen-border/50 dark:divide-cypress-border/50 overflow-hidden mb-5">
          {quickOptions.map((item) => {
            const isSelected = selectedPreset === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => handleSelectPreset(item.key)}
                className={`flex-row items-center justify-between px-4 py-3 active:bg-linen-border/30 dark:active:bg-cypress-border/40 ${
                  isSelected ? "bg-linen-border/20 dark:bg-cypress-border/25" : ""
                }`}
              >
                <Text
                  className={`text-sm ${
                    isSelected
                      ? "font-black text-linen-text-primary dark:text-accent-champagne"
                      : "font-medium text-linen-text-primary dark:text-cypress-text-primary"
                  }`}
                >
                  {item.label}
                </Text>
                {isSelected && <Check size={18} color={colorScheme === 'dark' ? '#D4AF37' : colors.tint} />}
              </Pressable>
            );
          })}
        </View>

        {/* Custom Date Range Section Header */}
        <Text className="text-[11px] font-bold text-linen-text-secondary dark:text-cypress-text-secondary mb-2 uppercase tracking-wider">
          {t("history.customDateRange")}
        </Text>

        {/* Custom Start & End Pickers */}
        <View className="space-y-3 mb-5">
          <View>
            <Text className="text-xs font-semibold text-linen-text-secondary dark:text-cypress-text-secondary mb-1.5">
              {t("history.startDate")}
            </Text>
            <View className="flex-row items-center justify-between px-2 py-1 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border">
              <Pressable
                onPress={() => setStartMonthOffset(-1)}
                className="p-2.5 rounded-lg active:opacity-60"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronLeft size={20} color={colors.text} />
              </Pressable>
              <Text className="text-sm font-bold text-linen-text-primary dark:text-cypress-text-primary font-mono">
                {getMonthLabel(localRange.start)}
              </Text>
              <Pressable
                onPress={() => setStartMonthOffset(1)}
                className="p-2.5 rounded-lg active:opacity-60"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronRight size={20} color={colors.text} />
              </Pressable>
            </View>
          </View>

          <View className="mt-3">
            <Text className="text-xs font-semibold text-linen-text-secondary dark:text-cypress-text-secondary mb-1.5">
              {t("history.endDate")}
            </Text>
            <View className="flex-row items-center justify-between px-2 py-1 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border">
              <Pressable
                onPress={() => setEndMonthOffset(-1)}
                className="p-2.5 rounded-lg active:opacity-60"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronLeft size={20} color={colors.text} />
              </Pressable>
              <Text className="text-sm font-bold text-linen-text-primary dark:text-cypress-text-primary font-mono">
                {getMonthLabel(localRange.end)}
              </Text>
              <Pressable
                onPress={() => setEndMonthOffset(1)}
                className="p-2.5 rounded-lg active:opacity-60"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronRight size={20} color={colors.text} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* OK Button */}
        <Pressable
          onPress={handleApply}
          className="w-full py-3.5 rounded-xl items-center bg-cypress-surface dark:bg-accent-champagne active:opacity-85 shadow-xs mb-4"
        >
          <Text className="text-base font-black text-white dark:text-[#0C1513]">
            {t("history.ok")}
          </Text>
        </Pressable>
      </ScrollView>
    </AppBottomSheet>
  );
}

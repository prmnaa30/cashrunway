import React, { useState, useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { AppBottomSheet } from "@/components/ui/AppBottomSheet";
import { useTranslation } from "@/lib/i18n";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export function getMonthRange(year: number, month: number): { start: string; end: string } {
  // month is 0-indexed here for Date
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0); // last day of month

  const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`;
  const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;

  return { start: startStr, end: endStr };
}

export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  return getMonthRange(now.getFullYear(), now.getMonth());
}

export function getLastMonthRange(): { start: string; end: string } {
  const now = new Date();
  return getMonthRange(now.getFullYear(), now.getMonth() - 1);
}

export function detectRangeMode(
  range: { start: string; end: string }
): "thisMonth" | "lastMonth" | "custom" {
  const current = getCurrentMonthRange();
  const last = getLastMonthRange();

  if (range.start === current.start && range.end === current.end) {
    return "thisMonth";
  }
  if (range.start === last.start && range.end === last.end) {
    return "lastMonth";
  }
  return "custom";
}

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

  const [mode, setMode] = useState<"thisMonth" | "lastMonth" | "custom">("thisMonth");
  const [localRange, setLocalRange] = useState(currentRange);

  useEffect(() => {
    if (visible) {
      setLocalRange(currentRange);
      setMode(detectRangeMode(currentRange));
    }
  }, [visible, currentRange]);

  const handleApply = () => {
    onSelectRange(localRange);
    onClose();
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
    const newStart = adjustDate(localRange.start, offset, true);
    if (newStart > localRange.end) return; // Prevent start > end
    setLocalRange({ ...localRange, start: newStart });
  };

  const setEndMonthOffset = (offset: number) => {
    const newEnd = adjustDate(localRange.end, offset, false);
    if (localRange.start > newEnd) return; // Prevent start > end
    setLocalRange({ ...localRange, end: newEnd });
  };

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title={t("history.rangePickerTitle")}
      subtitle={t("history.rangePickerSubtitle")}
    >
      <View className="px-5 pt-4 pb-6">
        <View className="flex-row gap-2 mb-4">
          {(["thisMonth", "lastMonth", "custom"] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => {
                setMode(m);
                if (m === "thisMonth") setLocalRange(getCurrentMonthRange());
                else if (m === "lastMonth") setLocalRange(getLastMonthRange());
              }}
              className={`flex-1 py-2 rounded-xl items-center border ${
                mode === m
                  ? "bg-linen-text-primary dark:bg-cypress-text-primary border-transparent"
                  : "bg-linen-surface dark:bg-cypress-surface border-linen-border dark:border-cypress-border"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  mode === m
                    ? "text-white dark:text-[#0C1513]"
                    : "text-linen-text-secondary dark:text-cypress-text-secondary"
                }`}
              >
                {m === "thisMonth"
                  ? t("history.quickThisMonth")
                  : m === "lastMonth"
                  ? t("history.quickLastMonth")
                  : t("history.quickCustom")}
              </Text>
            </Pressable>
          ))}
        </View>

        {mode === "custom" && (
          <View className="space-y-4 mb-4">
            <View>
              <Text className="text-xs font-bold text-linen-text-secondary dark:text-cypress-text-secondary mb-2 uppercase tracking-widest">
                {t("history.customFrom")}
              </Text>
              <View className="flex-row items-center justify-between p-1 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border">
                <Pressable onPress={() => setStartMonthOffset(-1)} className="p-3 active:opacity-70">
                  <ChevronLeft size={20} color={colors.textPrimary} />
                </Pressable>
                <Text className="text-sm font-bold text-linen-text-primary dark:text-cypress-text-primary">
                  {getMonthLabel(localRange.start)}
                </Text>
                <Pressable onPress={() => setStartMonthOffset(1)} className="p-3 active:opacity-70">
                  <ChevronRight size={20} color={colors.textPrimary} />
                </Pressable>
              </View>
            </View>

            <View>
              <Text className="text-xs font-bold text-linen-text-secondary dark:text-cypress-text-secondary mb-2 uppercase tracking-widest">
                {t("history.customTo")}
              </Text>
              <View className="flex-row items-center justify-between p-1 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border">
                <Pressable onPress={() => setEndMonthOffset(-1)} className="p-3 active:opacity-70">
                  <ChevronLeft size={20} color={colors.textPrimary} />
                </Pressable>
                <Text className="text-sm font-bold text-linen-text-primary dark:text-cypress-text-primary">
                  {getMonthLabel(localRange.end)}
                </Text>
                <Pressable onPress={() => setEndMonthOffset(1)} className="p-3 active:opacity-70">
                  <ChevronRight size={20} color={colors.textPrimary} />
                </Pressable>
              </View>
            </View>
          </View>
        )}

        <Pressable
          onPress={handleApply}
          className="w-full py-4 rounded-xl items-center mt-2 bg-linen-text-primary dark:bg-accent-champagne active:opacity-80"
        >
          <Text className="text-base font-bold text-white dark:text-[#0C1513]">
            {t("history.applyRange")}
          </Text>
        </Pressable>
      </View>
    </AppBottomSheet>
  );
}

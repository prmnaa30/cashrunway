import React from "react";
import { View, Text, Pressable } from "react-native";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useTranslation } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import Colors from "@/constants/Colors";

interface TransactionPeriodHeaderProps {
  selectedRange: { start: string; end: string };
  totalIncome: number;
  totalExpense: number;
  transactionCount: number;
  isPrivacyMode: boolean;
  colorScheme: "light" | "dark";
  onOpenPicker: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  isCurrentMonth: boolean;
}

export function TransactionPeriodHeader({
  selectedRange,
  totalIncome,
  totalExpense,
  transactionCount,
  isPrivacyMode,
  colorScheme,
  onOpenPicker,
  onPrevMonth,
  onNextMonth,
  isCurrentMonth,
}: TransactionPeriodHeaderProps) {
  const { t } = useTranslation();
  const colors = Colors[colorScheme];

  const startDate = new Date(selectedRange.start + "T00:00:00");
  const month = startDate.getMonth() + 1;
  const year = startDate.getFullYear();

  const netAmount = totalIncome - totalExpense;
  const isSurplus = netAmount >= 0;

  return (
    <View className="mb-4 rounded-3xl bg-linen-card dark:bg-[#13221E] border border-accent-brass/35 dark:border-accent-champagne/25 p-4 shadow-xs">
      {/* 1. Integrated Date Navigation Header */}
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={onPrevMonth}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="w-8 h-8 items-center justify-center rounded-full bg-linen-surface dark:bg-[#1A2E28] border border-linen-border/80 dark:border-cypress-border/80 active:opacity-60"
          accessibilityLabel={t("history.prevPeriod")}
        >
          <ChevronLeft size={18} color={colors.text} />
        </Pressable>

        <Pressable
          onPress={onOpenPicker}
          className="flex-row items-center px-3.5 py-1.5 rounded-full bg-linen-surface dark:bg-[#1A2E28] border border-linen-border dark:border-cypress-border active:opacity-75"
          accessibilityLabel={t("history.rangePickerTitle")}
        >
          <Text className="text-sm font-black text-linen-text-primary dark:text-cypress-text-primary mr-1.5 tracking-tight">
            {t("history.periodLabel", { month: month.toString(), year: year.toString() })}
          </Text>
          <ChevronDown size={14} color={colorScheme === 'dark' ? '#D4AF37' : colors.textSecondary} />
        </Pressable>

        <Pressable
          onPress={onNextMonth}
          disabled={isCurrentMonth}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className={`w-8 h-8 items-center justify-center rounded-full bg-linen-surface dark:bg-[#1A2E28] border border-linen-border/80 dark:border-cypress-border/80 active:opacity-60 ${
            isCurrentMonth ? "opacity-30" : ""
          }`}
          accessibilityLabel={t("history.nextPeriod")}
        >
          <ChevronRight size={18} color={colors.text} />
        </Pressable>
      </View>

      {/* Divider */}
      <View className="h-[1px] bg-linen-border/60 dark:bg-cypress-border/50 my-3" />

      {/* 2. Integrated Financial Summary */}
      <View className="flex-row justify-between items-center mb-2 px-1">
        <View>
          <Text className="text-[10px] uppercase font-bold tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary mb-0.5">
            {t("history.totalIncome")}
          </Text>
          <Text className="text-sm font-extrabold text-status-safe font-mono tabular-nums">
            +{formatCurrency(totalIncome, isPrivacyMode)}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-[10px] uppercase font-bold tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary mb-0.5">
            {t("history.totalExpense")}
          </Text>
          <Text className="text-sm font-extrabold text-status-danger font-mono tabular-nums">
            -{formatCurrency(totalExpense, isPrivacyMode)}
          </Text>
        </View>
      </View>

      {/* Net Outcome Pill Banner */}
      <View
        className={`flex-row justify-between items-center px-3 py-2 rounded-xl ${
          isSurplus
            ? "bg-status-safe/10 border border-status-safe/25"
            : "bg-status-danger/10 border border-status-danger/25"
        }`}
      >
        <Text
          className={`text-[11px] font-bold ${
            isSurplus ? "text-status-safe" : "text-status-danger"
          }`}
        >
          Net: {isSurplus ? t("history.netSurplus") : t("history.netDeficit")}
        </Text>
        <Text
          className={`text-sm font-black font-mono tabular-nums ${
            isSurplus ? "text-status-safe" : "text-status-danger"
          }`}
        >
          {isSurplus ? "+" : "-"}{formatCurrency(Math.abs(netAmount), isPrivacyMode)}
        </Text>
      </View>
    </View>
  );
}

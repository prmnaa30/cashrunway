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
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <Pressable 
          onPress={onPrevMonth}
          className="w-10 h-10 items-center justify-center rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border active:opacity-70"
          accessibilityLabel={t("history.prevPeriod")}
        >
          <ChevronLeft size={20} color={colors.textPrimary} />
        </Pressable>

        <Pressable 
          onPress={onOpenPicker}
          className="flex-row items-center px-4 py-2 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border active:opacity-70"
        >
          <Text className="text-base font-bold text-linen-text-primary dark:text-cypress-text-primary mr-1">
            {t("history.periodLabel", { month: month.toString(), year: year.toString() })}
          </Text>
          <ChevronDown size={16} color={colors.textSecondary} />
        </Pressable>

        <Pressable 
          onPress={onNextMonth}
          disabled={isCurrentMonth}
          className={`w-10 h-10 items-center justify-center rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border active:opacity-70 ${isCurrentMonth ? "opacity-40" : ""}`}
          accessibilityLabel={t("history.nextPeriod")}
        >
          <ChevronRight size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      {transactionCount > 0 && (
        <View className="p-4 rounded-2xl bg-linen-card dark:bg-cypress-card border border-linen-border dark:border-cypress-border">
          <View className="flex-row justify-between mb-2">
            <View>
              <Text className="text-xs font-medium text-linen-text-secondary dark:text-cypress-text-secondary mb-0.5">
                {t("history.totalIncome")}
              </Text>
              <Text className="text-sm font-bold text-status-safe">
                +{formatCurrency(totalIncome, isPrivacyMode)}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-xs font-medium text-linen-text-secondary dark:text-cypress-text-secondary mb-0.5">
                {t("history.totalExpense")}
              </Text>
              <Text className="text-sm font-bold text-status-danger">
                -{formatCurrency(totalExpense, isPrivacyMode)}
              </Text>
            </View>
          </View>
          
          <View className="h-[1px] bg-linen-border/50 dark:bg-cypress-border/50 my-2" />
          
          <View className="flex-row justify-between items-center mt-1">
            <Text className="text-xs font-medium text-linen-text-secondary dark:text-cypress-text-secondary">
              Net: {isSurplus ? t("history.netSurplus") : t("history.netDeficit")}
            </Text>
            <Text className={`text-base font-black ${isSurplus ? "text-status-safe" : "text-status-danger"}`}>
              {isSurplus ? "+" : "-"}{formatCurrency(Math.abs(netAmount), isPrivacyMode)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

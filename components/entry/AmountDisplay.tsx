import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { TransactionMode } from './types';
import { formatCurrency, getCurrencySymbol } from '@/lib/format';
import { useSettingsStore } from '@/store/useSettingStore';
import { useQuickEntryStore } from '@/store/useQuickEntryStore';

export interface AmountDisplayProps {
  expression?: string;
  amount?: number;
  mode: TransactionMode;
  colorScheme: 'light' | 'dark';
}

/**
 * Large tactile display of transaction amount with dynamic blinking cursor and calculation preview.
 */
function AmountDisplayComponent({
  expression: propExpression,
  amount: propAmount,
  mode,
  colorScheme,
}: AmountDisplayProps) {
  const storeExpression = useQuickEntryStore((s) => s.expression);
  const storeAmount = useQuickEntryStore((s) => s.amount);
  const expression = propExpression !== undefined ? propExpression : storeExpression;
  const amount = propAmount !== undefined ? propAmount : storeAmount;
  const currency = useSettingsStore((s) => s.currency);
  const symbol = getCurrencySymbol(currency);

  const cursorOpacity = useSharedValue(1);

  useEffect(() => {
    cursorOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 450 }),
        withTiming(1, { duration: 450 })
      ),
      -1,
      true
    );
    return () => {
      cancelAnimation(cursorOpacity);
    };
  }, []);

  const animatedCursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  const hasCalculation =
    expression.includes('+') ||
    expression.includes('-') ||
    expression.includes(' ');

  const formattedAmount = formatCurrency(amount, {
    currency,
    isPrivacy: false,
  });

  const modeColorClass =
    mode === 'income'
      ? 'text-status-safe'
      : mode === 'expense'
      ? 'text-linen-text-primary dark:text-cypress-text-primary'
      : 'text-linen-text-primary dark:text-cypress-text-primary';

  const cursorColor =
    mode === 'income'
      ? '#10B981'
      : mode === 'expense'
      ? colorScheme === 'dark'
        ? '#D4AF37'
        : '#B8860B'
      : colorScheme === 'dark'
      ? '#D4AF37'
      : '#B8860B';

  return (
    <View className="items-center justify-center px-4 pt-1 pb-2">
      {/* Fixed height container for calculation indicator to prevent layout jumping */}
      <View className="h-6 items-center justify-center mb-1">
        {hasCalculation ? (
          <View className="px-3 py-0.5 rounded-full bg-linen-card dark:bg-cypress-surface border border-linen-border dark:border-cypress-border">
            <Text className="text-xs font-mono font-medium text-linen-text-secondary dark:text-cypress-text-secondary">
              {expression}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row items-center justify-center min-h-[44px]">
        <Text
          className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${modeColorClass}`}
        >
          {mode === 'expense' && amount > 0 ? '-' : mode === 'income' && amount > 0 ? '+' : ''}
          {formattedAmount}
        </Text>

        <Animated.View
          style={[animatedCursorStyle, { backgroundColor: cursorColor }]}
          className="ml-1 w-0.5 h-7 rounded-full"
        />
      </View>
    </View>
  );
}

export const AmountDisplay = React.memo(AmountDisplayComponent);

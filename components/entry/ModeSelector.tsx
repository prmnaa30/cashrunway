import React, { useEffect, useCallback } from 'react';
import { View, Text, Pressable, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react-native';
import { TransactionMode } from './types';
import { useTranslation } from '@/lib/i18n';
import Colors, { Palette } from '@/constants/Colors';

export interface ModeSelectorProps {
  mode: TransactionMode;
  onSelectMode: (mode: TransactionMode) => void;
  colorScheme: 'light' | 'dark';
}

const MODES: { id: TransactionMode; icon: any }[] = [
  { id: 'expense', icon: ArrowDownLeft },
  { id: 'income', icon: ArrowUpRight },
  { id: 'transfer', icon: ArrowLeftRight },
];

/**
 * Animated 3-mode segmented tab selector for Quick Entry: Expense, Income, and Transfer.
 * Features a hardware-accelerated Reanimated sliding pill indicator with springy cubic-bezier easing.
 */
function ModeSelectorComponent({
  mode,
  onSelectMode,
  colorScheme,
}: ModeSelectorProps) {
  const { t } = useTranslation();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme];

  const activeIndex = mode === 'expense' ? 0 : mode === 'income' ? 1 : 2;

  const tabAnim = useSharedValue(activeIndex);
  const containerWidth = useSharedValue(0);

  useEffect(() => {
    tabAnim.value = withTiming(activeIndex, {
      duration: 220,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  }, [activeIndex]);

  const pillAnimatedStyle = useAnimatedStyle(() => {
    const w = containerWidth.value;
    if (w < 80) {
      return {
        opacity: 0,
        width: 0,
      };
    }

    const availableWidth = Math.max(0, w - 8); // 4px padding on left and right (p-1)
    const itemWidth = availableWidth / 3;

    return {
      opacity: 1,
      width: itemWidth,
      transform: [
        {
          translateX: tabAnim.value * itemWidth,
        },
      ],
    };
  });

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width >= 80 && Math.abs(containerWidth.value - width) > 0.5) {
      containerWidth.value = width;
    }
  }, []);

  return (
    <View
      onLayout={handleLayout}
      className="relative flex-row rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border p-1 mx-4 mb-2"
    >
      {/* Sliding Pill Indicator */}
      <Animated.View
        style={[
          pillAnimatedStyle,
          {
            position: 'absolute',
            top: 4,
            left: 4,
            bottom: 4,
          },
        ]}
        className="rounded-xl bg-white dark:bg-cypress-card border border-linen-border/40 dark:border-cypress-border/60 shadow-xs"
      />

      {MODES.map((item) => {
        const isActive = mode === item.id;
        const Icon = item.icon;
        const label =
          item.id === 'expense'
            ? t('entry.expense')
            : item.id === 'income'
            ? t('entry.income')
            : t('entry.transfer');

        let activeTextClass = 'text-linen-text-primary dark:text-cypress-text-primary';
        let iconColor = colors.textSecondary;

        if (isActive) {
          if (item.id === 'expense') {
            activeTextClass = 'text-status-danger font-black';
            iconColor = '#EF4444';
          } else if (item.id === 'income') {
            activeTextClass = 'text-status-safe font-black';
            iconColor = '#10B981';
          } else {
            activeTextClass = isDark
              ? 'text-accent-champagne font-black'
              : 'text-accent-brass font-black';
            iconColor = isDark ? Palette.champagneGold : Palette.burnishedBrass;
          }
        }

        return (
          <Pressable
            key={item.id}
            onPress={() => onSelectMode(item.id)}
            className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl z-10 active:opacity-80"
          >
            <Icon size={15} color={iconColor} strokeWidth={isActive ? 2.5 : 1.8} />
            <Text
              className={`text-xs ml-1.5 ${
                isActive
                  ? activeTextClass
                  : 'font-medium text-linen-text-secondary dark:text-cypress-text-secondary opacity-70'
              }`}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const ModeSelector = React.memo(ModeSelectorComponent);

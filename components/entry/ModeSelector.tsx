import React, { useEffect, useCallback } from 'react';
import { View, Text, Pressable, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react-native';
import { TransactionMode } from './types';
import Colors from '@/constants/Colors';
import { useTranslation } from '@/lib/i18n';

export interface ModeSelectorProps {
  mode: TransactionMode;
  onSelectMode: (mode: TransactionMode) => void;
  colorScheme: 'light' | 'dark';
}

/**
 * 3-mode segmented tab selector with smooth Reanimated sliding indicator.
 */
function ModeSelectorComponent({
  mode,
  onSelectMode,
  colorScheme,
}: ModeSelectorProps) {
  const colors = Colors[colorScheme];
  const { t } = useTranslation();

  const modes: { id: TransactionMode; label: string; icon: any }[] = [
    { id: 'expense', label: t('entry.modeExpense'), icon: ArrowDownLeft },
    { id: 'income', label: t('entry.modeIncome'), icon: ArrowUpRight },
    { id: 'transfer', label: t('entry.modeTransfer'), icon: ArrowLeftRight },
  ];

  const selectedIndex = modes.findIndex((m) => m.id === mode);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const tabAnim = useSharedValue(activeIndex);
  const containerWidth = useSharedValue(0);

  useEffect(() => {
    tabAnim.value = withSpring(activeIndex, {
      damping: 20,
      stiffness: 200,
      mass: 0.7,
    });
  }, [activeIndex]);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w >= 80 && Math.abs(containerWidth.value - w) > 0.5) {
      containerWidth.value = w;
    }
  }, []);

  const pillAnimatedStyle = useAnimatedStyle(() => {
    const w = containerWidth.value;
    if (w < 80) {
      return { opacity: 0, width: 0 };
    }
    const availableWidth = Math.max(0, w - 8);
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

  return (
    <View
      onLayout={handleLayout}
      className="relative flex-row rounded-2xl bg-linen-surface dark:bg-cypress-card border border-linen-border dark:border-cypress-border p-1 mx-4 mb-2 overflow-hidden"
    >
      {/* Reanimated UI-thread sliding indicator pill */}
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
        className="rounded-xl bg-linen-card dark:bg-cypress-surface border border-linen-border/60 dark:border-cypress-border/60"
      />

      {modes.map((item) => {
        const isActive = mode === item.id;
        const Icon = item.icon;

        let activeTextColor = colors.text;
        let iconColor = colors.textSecondary;

        if (isActive) {
          if (item.id === 'expense') {
            activeTextColor = '#EF4444';
            iconColor = '#EF4444';
          } else if (item.id === 'income') {
            activeTextColor = '#10B981';
            iconColor = '#10B981';
          } else {
            activeTextColor = colorScheme === 'dark' ? '#D4AF37' : '#B8860B';
            iconColor = activeTextColor;
          }
        }

        return (
          <Pressable
            key={item.id}
            onPress={() => onSelectMode(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl z-10 active:opacity-85"
          >
            <Icon size={15} color={iconColor} strokeWidth={isActive ? 2.5 : 1.8} />
            <Text
              style={{ color: isActive ? activeTextColor : colors.textSecondary }}
              className={`text-xs ml-1.5 ${isActive ? 'font-black' : 'font-semibold'}`}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const ModeSelector = React.memo(ModeSelectorComponent);

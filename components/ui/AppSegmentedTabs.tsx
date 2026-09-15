import React, { useEffect, useCallback } from 'react';
import { View, Text, Pressable, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';

export interface TabOption<T extends string | number = string> {
  key: T;
  label: string;
}

export interface AppSegmentedTabsProps<T extends string | number = string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  accessibilityLabel?: string;
}

export function AppSegmentedTabs<T extends string | number = string>({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
  accessibilityLabel,
}: AppSegmentedTabsProps<T>) {
  const colorScheme = useColorScheme() ?? 'dark';
  const isDark = colorScheme === 'dark';

  const selectedIndex = options.findIndex((opt) => opt.key === value);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const tabAnim = useSharedValue(activeIndex);
  const containerWidth = useSharedValue(0);

  useEffect(() => {
    tabAnim.value = withTiming(activeIndex, {
      duration: 200,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  }, [activeIndex]);

  const numOptions = Math.max(1, options.length);

  // Reanimated UI-thread style computation
  const pillAnimatedStyle = useAnimatedStyle(() => {
    const w = containerWidth.value;
    // Guard against unmeasured or collapsed layout frames (fixes thin vertical bar glitch)
    if (w < 80) {
      return {
        opacity: 0,
        width: 0,
      };
    }

    const availableWidth = Math.max(0, w - 8);
    const itemWidth = availableWidth / numOptions;

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

  const isSmall = size === 'sm';
  const itemPadding = isSmall ? 'py-1.5' : 'py-2';
  const textClass = isSmall ? 'text-[11px]' : 'text-xs';

  return (
    <View
      onLayout={handleLayout}
      className={"relative flex-row p-1 rounded-2xl bg-linen-surface dark:bg-cypress-card border border-linen-border/70 dark:border-cypress-border/70 " + className}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {/* Reanimated UI-thread sliding pill */}
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
        className="rounded-xl bg-white dark:bg-accent-champagne shadow-xs border border-linen-border/40 dark:border-transparent"
      />

      {options.map((opt) => {
        const isSelected = opt.key === value;
        return (
          <Pressable
            key={String(opt.key)}
            onPress={() => onChange(opt.key)}
            className={"flex-1 " + itemPadding + " min-h-[40px] items-center justify-center rounded-xl z-10"}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              numberOfLines={1}
              className={textClass + " font-bold text-center " + (
                isSelected
                  ? isDark
                    ? 'text-black font-extrabold'
                    : 'text-linen-text-primary font-extrabold'
                  : 'text-linen-text-secondary dark:text-cypress-text-secondary'
              )}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

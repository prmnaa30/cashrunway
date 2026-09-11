import React, { ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';

interface SettingRowProps {
  label: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  onPress?: () => void;
  isLast?: boolean;
  isDanger?: boolean;
}

export function SettingRow({
  label,
  description,
  icon,
  action,
  onPress,
  isLast = false,
  isDanger = false,
}: SettingRowProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const isDark = colorScheme === 'dark';
  const content = (
    <View
      className={`flex-row items-center justify-between py-3.5 px-4 min-h-[52px] ${
        !isLast ? 'border-b border-linen-border/70 dark:border-cypress-border/70' : ''
      }`}
    >
      <View className="flex-row items-center flex-1 pr-3">
        {icon && <View className="mr-3">{icon}</View>}
        <View className="flex-1">
          <Text
            className={`text-sm font-semibold ${
              isDanger
                ? 'text-status-danger'
                : 'text-linen-text-primary dark:text-cypress-text-primary'
            }`}
          >
            {label}
          </Text>
          {description && (
            <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary mt-0.5 leading-4">
              {description}
            </Text>
          )}
        </View>
      </View>

      <View className="flex-row items-center">
        {action}
        {onPress && !action && (
          <ChevronRight
            size={18}
            color={isDark ? 'rgba(141, 164, 153, 0.5)' : 'rgba(82, 102, 94, 0.5)'}
            className="ml-2"
          />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className="active:opacity-70"
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

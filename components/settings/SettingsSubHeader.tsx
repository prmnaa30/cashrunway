import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

interface SettingsSubHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export function SettingsSubHeader({ title, subtitle, rightAction }: SettingsSubHeaderProps) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  return (
    <View className="flex-row items-center justify-between px-5 pt-3 pb-3.5 border-b border-linen-border/70 dark:border-cypress-border/70 bg-linen-bg dark:bg-cypress-bg">
      <View className="flex-row items-center flex-1 pr-3">
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="w-10 h-10 rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border items-center justify-center mr-3.5 active:opacity-70"
          accessibilityLabel="Kembali"
        >
          <ArrowLeft size={19} color={colors.text} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-black tracking-tight text-linen-text-primary dark:text-cypress-text-primary">
            {title}
          </Text>
          {subtitle && (
            <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary mt-0.5 leading-4">
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightAction && <View>{rightAction}</View>}
    </View>
  );
}

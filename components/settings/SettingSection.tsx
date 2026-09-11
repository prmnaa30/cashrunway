import React, { ReactNode } from 'react';
import { View, Text } from 'react-native';

interface SettingSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SettingSection({ title, description, children }: SettingSectionProps) {
  return (
    <View className="mb-6">
      <View className="px-1 mb-2">
        <Text className="text-[11px] font-bold uppercase tracking-widest text-linen-text-secondary dark:text-cypress-text-secondary">
          {title}
        </Text>
        {description && (
          <Text className="text-xs text-linen-text-secondary/80 dark:text-cypress-text-secondary/80 mt-0.5">
            {description}
          </Text>
        )}
      </View>
      <View className="bg-linen-card dark:bg-cypress-card rounded-2xl border border-linen-border dark:border-cypress-border overflow-hidden">
        {children}
      </View>
    </View>
  );
}

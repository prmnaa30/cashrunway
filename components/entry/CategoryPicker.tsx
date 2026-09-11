import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Category } from '@/lib/db';
import { TransactionMode } from './types';
import Colors from '@/constants/Colors';

export interface CategoryPickerProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
  mode: TransactionMode;
  colorScheme: 'light' | 'dark';
}

/**
 * Category picker with emoji icons filtered by transaction mode (expense vs income).
 */
export function CategoryPicker({
  categories,
  selectedCategoryId,
  onSelectCategory,
  mode,
  colorScheme,
}: CategoryPickerProps) {
  if (mode === 'transfer') {
    return null;
  }

  const colors = Colors[colorScheme];
  const filteredCategories = categories.filter((c) => c.type === mode);

  return (
    <View className="mb-2">
      <View className="px-4 mb-1">
        <Text className="text-[11px] font-bold text-linen-text-secondary dark:text-cypress-text-secondary uppercase tracking-wider">
          Kategori
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        className="flex-row py-1"
      >
        {filteredCategories.map((category) => {
          const isSelected = category.id === selectedCategoryId;

          let bgClass =
            'bg-linen-surface dark:bg-cypress-card border-linen-border/80 dark:border-cypress-border/80';
          let textClass =
            'text-linen-text-secondary dark:text-cypress-text-secondary';

          if (isSelected) {
            bgClass =
              mode === 'income'
                ? 'bg-status-safe/15 border-status-safe'
                : colorScheme === 'dark'
                ? 'bg-accent-champagne/15 border-accent-champagne'
                : 'bg-emerald-500/10 border-emerald-600';
            textClass =
              mode === 'income'
                ? 'text-status-safe font-bold'
                : colorScheme === 'dark'
                ? 'text-accent-champagne font-bold'
                : 'text-emerald-800 font-bold';
          }

          return (
            <Pressable
              key={category.id}
              onPress={() => onSelectCategory(category.id)}
              className={`flex-row items-center px-3 py-2 mr-2 rounded-xl border ${bgClass}`}
            >
              <Text className="text-base mr-1.5">{category.icon}</Text>
              <Text className={`text-xs ${textClass}`}>{category.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

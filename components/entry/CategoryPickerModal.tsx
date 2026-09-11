import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import { Check, X, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Category } from '@/lib/db';
import { TransactionMode } from './types';
import Colors from '@/constants/Colors';
import { CategoryFormModal } from '../categories/CategoryFormModal';

export interface CategoryPickerModalProps {
  visible: boolean;
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
  onClose: () => void;
  mode: TransactionMode;
  colorScheme: 'light' | 'dark';
}

/**
 * Overlay picker displaying the complete emoji category grid with smooth fade animation.
 */
function CategoryPickerModalComponent({
  visible,
  categories,
  selectedCategoryId,
  onSelectCategory,
  onClose,
  mode,
  colorScheme,
}: CategoryPickerModalProps) {
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === mode),
    [categories, mode]
  );

  return (
    <Modal
      visible={visible && mode !== 'transfer'}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        className="flex-1 justify-center items-center px-5 bg-black/65"
        style={{
          paddingTop: Math.max(insets.top, 24) + 16,
          paddingBottom: Math.max(insets.bottom, 16) + 12,
        }}
      >
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Tutup"
        />

        <View className="w-full max-w-sm rounded-3xl bg-linen-bg dark:bg-cypress-bg border border-linen-border dark:border-cypress-border p-5 shadow-2xl z-10 max-h-[82%]">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-linen-border/60 dark:border-cypress-border/60">
            <Text className="text-base font-black text-linen-text-primary dark:text-cypress-text-primary">
              Pilih Kategori {mode === 'income' ? 'Pemasukan' : 'Pengeluaran'}
            </Text>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-7 h-7 rounded-full bg-linen-surface dark:bg-cypress-card border border-linen-border dark:border-cypress-border items-center justify-center"
          >
            <X size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Grid of Categories */}
        <ScrollView
          className="mt-3 max-h-80"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row flex-wrap justify-between">
            {filteredCategories.map((category) => {
              const isSelected = category.id === selectedCategoryId;

              let borderClass =
                'bg-linen-surface dark:bg-cypress-card border-linen-border/80 dark:border-cypress-border/80';
              let textClass =
                'text-linen-text-primary dark:text-cypress-text-primary';

              if (isSelected) {
                if (mode === 'income') {
                  borderClass = 'bg-status-safe/15 border-status-safe';
                  textClass = 'text-status-safe font-bold';
                } else {
                  borderClass =
                    colorScheme === 'dark'
                      ? 'bg-accent-champagne/15 border-accent-champagne'
                      : 'bg-emerald-500/10 border-emerald-600';
                  textClass =
                    colorScheme === 'dark'
                      ? 'text-accent-champagne font-bold'
                      : 'text-emerald-800 font-bold';
                }
              }

              return (
                <TouchableOpacity
                  key={category.id}
                  activeOpacity={0.75}
                  onPress={() => {
                    onSelectCategory(category.id);
                    onClose();
                  }}
                  className={`w-[48%] flex-row items-center p-3 mb-2.5 rounded-2xl border ${borderClass}`}
                >
                  <Text className="text-2xl mr-2">{category.icon}</Text>
                  <View className="flex-1 mr-1">
                    <Text
                      className={`text-xs font-semibold ${textClass}`}
                      numberOfLines={1}
                    >
                      {category.name}
                    </Text>
                    {Boolean(category.isFixed) && (
                      <Text className="text-[10px] text-linen-text-secondary/70 dark:text-cypress-text-secondary/70">
                        Rutin
                      </Text>
                    )}
                  </View>

                  {isSelected && (
                    <View
                      className={`w-4 h-4 rounded-full items-center justify-center ${
                        mode === 'income'
                          ? 'bg-status-safe'
                          : colorScheme === 'dark'
                          ? 'bg-accent-champagne'
                          : 'bg-emerald-600'
                      }`}
                    >
                      <Check
                        size={10}
                        color={colorScheme === 'dark' && mode !== 'income' ? '#0C1513' : '#FFFFFF'}
                        strokeWidth={3}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Add Custom Category Action Card */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setIsFormModalVisible(true)}
              className="w-[48%] flex-row items-center p-3 mb-2.5 rounded-2xl border border-dashed border-linen-border dark:border-cypress-border bg-linen-surface/50 dark:bg-cypress-card/40"
            >
              <View className="w-7 h-7 rounded-full bg-linen-border/40 dark:bg-cypress-border/40 items-center justify-center mr-2">
                <Plus size={15} color={colors.textSecondary} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-xs font-bold text-linen-text-secondary dark:text-cypress-text-secondary"
                  numberOfLines={1}
                >
                  + Tambah Baru
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>

    {/* Universal Category Form Modal */}
    <CategoryFormModal
      visible={isFormModalVisible}
      initialType={mode === 'income' ? 'income' : 'expense'}
      onSave={(newCat) => {
        onSelectCategory(newCat.id);
        setIsFormModalVisible(false);
        onClose();
      }}
      onClose={() => setIsFormModalVisible(false)}
      colorScheme={colorScheme}
    />
  </Modal>
);
}

export const CategoryPickerModal = React.memo(CategoryPickerModalComponent);

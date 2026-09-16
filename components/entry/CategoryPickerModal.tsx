import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Check, Plus } from 'lucide-react-native';
import { Category } from '@/lib/db';
import { TransactionMode } from './types';
import { AppModal } from '@/components/ui/AppModal';
import { CategoryFormModal } from '../categories/CategoryFormModal';
import Colors from '@/constants/Colors';
import { useTranslation } from '@/lib/i18n';

export interface CategoryPickerModalProps {
  visible: boolean;
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
  onClose: () => void;
  mode: TransactionMode;
  colorScheme: 'light' | 'dark';
  useNativeModal?: boolean;
}

export function CategoryPickerModal({
  visible,
  categories,
  selectedCategoryId,
  onSelectCategory,
  onClose,
  mode,
  colorScheme,
  useNativeModal = true,
}: CategoryPickerModalProps) {
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();

  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === mode),
    [categories, mode]
  );

  const modalTitle =
    mode === 'expense'
      ? t('entry.categoryExpenseTitle')
      : t('entry.categoryIncomeTitle');

  return (
    <>
      <AppModal
        visible={visible && mode !== 'transfer'}
        onClose={onClose}
        title={modalTitle}
        maxWidth={400}
        useNativeModal={useNativeModal}
      >
        <ScrollView className="max-h-80" showsVerticalScrollIndicator={false}>
          <View className="flex-row flex-wrap justify-start">
            {filteredCategories.map((category) => {
              const isSelected = category.id === selectedCategoryId;
              return (
                <View key={category.id} style={{ width: '25%', padding: 4 }}>
                  <TouchableOpacity
                    onPress={() => {
                      onSelectCategory(category.id);
                      onClose();
                    }}
                    activeOpacity={0.7}
                    className={"items-center justify-center p-2.5 rounded-2xl border aspect-square " + (
                      isSelected
                        ? 'bg-linen-surface dark:bg-cypress-surface border-accent-brass dark:border-accent-champagne'
                        : 'bg-linen-card dark:bg-cypress-card border-linen-border dark:border-cypress-border active:opacity-70'
                    )}
                  >
                    <Text style={{ fontSize: 24 }} className="mb-1">
                      {category.icon}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className={"text-[10px] font-semibold text-center " + (
                        isSelected
                          ? 'text-accent-brass dark:text-accent-champagne font-bold'
                          : 'text-linen-text-primary dark:text-cypress-text-primary'
                      )}
                    >
                      {category.name}
                    </Text>
                    {isSelected && (
                      <View className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-accent-brass dark:bg-accent-champagne items-center justify-center">
                        <Check size={10} color={isDark ? '#000000' : '#FFFFFF'} strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* Add Custom Category button */}
            <View style={{ width: '25%', padding: 4 }}>
              <TouchableOpacity
                onPress={() => setIsFormModalVisible(true)}
                activeOpacity={0.7}
                className="items-center justify-center p-2.5 rounded-2xl border border-dashed border-linen-border dark:border-cypress-border aspect-square bg-linen-surface/50 dark:bg-cypress-surface/50 active:opacity-70"
              >
                <Plus size={20} color={colors.textSecondary} />
                <Text
                  numberOfLines={1}
                  className="text-[10px] font-semibold text-center text-linen-text-secondary dark:text-cypress-text-secondary mt-1"
                >
                  {t('entry.addCategory')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </AppModal>

      {/* Form Modal for Creating Category */}
      <CategoryFormModal
        visible={isFormModalVisible}
        initialType={mode === 'income' ? 'income' : 'expense'}
        colorScheme={colorScheme}
        onClose={() => setIsFormModalVisible(false)}
        onSave={(newCat: Category) => {
          setIsFormModalVisible(false);
          onSelectCategory(newCat.id);
          onClose();
        }}
      />
    </>
  );
}

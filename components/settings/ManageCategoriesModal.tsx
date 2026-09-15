import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Plus, Pencil, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Category } from '@/lib/db';
import { useFinanceStore } from '@/store/useFinanceStore';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { AppSegmentedTabs } from '@/components/ui/AppSegmentedTabs';
import { DangerConfirmModal } from './DangerConfirmModal';
import { CategoryFormModal } from '../categories/CategoryFormModal';
import { useTranslation } from '@/lib/i18n';

export interface ManageCategoriesModalProps {
  visible: boolean;
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export function ManageCategoriesModal({
  visible,
  onClose,
}: ManageCategoriesModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';

  const categories = useFinanceStore((s) => s.categories);
  const deleteCategory = useFinanceStore((s) => s.deleteCategory);

  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === activeTab),
    [categories, activeTab]
  );

  const handleOpenAdd = () => {
    setCategoryToEdit(null);
    setIsFormModalVisible(true);
  };

  const handleOpenEdit = (category: Category) => {
    setCategoryToEdit(category);
    setIsFormModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory(categoryToDelete.id);
    } catch (err) {
      console.error('Failed to delete category:', err);
    } finally {
      setCategoryToDelete(null);
    }
  };

  return (
    <>
      <AppBottomSheet
        visible={visible}
        onClose={onClose}
        title={t('categories.title')}
        subtitle={t('categories.desc')}
        maxHeight="90%"
      >
        <View className="px-5 pt-2 pb-3">
          {/* Top Actions: AppSegmentedTabs & Add Button */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1 mr-3">
              <AppSegmentedTabs<'expense' | 'income'>
                size="sm"
                value={activeTab}
                onChange={(val) => setActiveTab(val)}
                options={[
                  { key: 'expense', label: t('categories.tabExpense') },
                  { key: 'income', label: t('categories.tabIncome') },
                ]}
              />
            </View>

            <TouchableOpacity
              onPress={handleOpenAdd}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="flex-row items-center px-3.5 py-2.5 rounded-xl bg-cypress-surface dark:bg-accent-champagne shadow-xs"
            >
              <Plus size={14} color={colorScheme === 'dark' ? '#0C1513' : '#FFFFFF'} strokeWidth={2.5} />
              <Text className="ml-1 text-xs font-bold text-white dark:text-[#0C1513]">
                {t('categories.addButton')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Smooth ScrollView with bounded height for reliable scrolling */}
          <ScrollView
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
            style={{ maxHeight: SCREEN_HEIGHT * 0.55 }}
            contentContainerStyle={{
              paddingBottom: Math.max(insets.bottom, 24) + 16,
            }}
          >
            {filteredCategories.map((cat) => {
              const isLocked = Boolean(cat.isDefault);
              return (
                <View
                  key={cat.id}
                  className="flex-row items-center justify-between p-3.5 mb-2.5 rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border/70 dark:border-cypress-border/70"
                >
                  <View className="flex-row items-center flex-1 mr-2">
                    <View className="w-10 h-10 rounded-xl bg-linen-bg dark:bg-cypress-card border border-linen-border dark:border-cypress-border items-center justify-center mr-3">
                      <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-linen-text-primary dark:text-cypress-text-primary">
                        {cat.name}
                      </Text>
                      <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary">
                        {isLocked ? t('categories.default') : t('categories.custom')}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center space-x-1">
                    <TouchableOpacity
                      onPress={() => handleOpenEdit(cat)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      className="p-2 rounded-lg active:bg-linen-border/30 dark:active:bg-cypress-border/30"
                    >
                      <Pencil size={15} color={colorScheme === 'dark' ? '#CBDAD3' : '#4E6B5D'} />
                    </TouchableOpacity>

                    {!isLocked && (
                      <TouchableOpacity
                        onPress={() => setCategoryToDelete(cat)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        className="p-2 rounded-lg active:bg-status-danger/10"
                      >
                        <Trash2 size={15} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}

            {filteredCategories.length === 0 && (
              <View className="py-12 items-center justify-center">
                <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
                  {t('categories.emptyState')}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </AppBottomSheet>

      {/* Reusable Category Form Modal */}
      <CategoryFormModal
        visible={isFormModalVisible}
        categoryToEdit={categoryToEdit}
        initialType={activeTab}
        colorScheme={colorScheme}
        onClose={() => {
          setIsFormModalVisible(false);
          setCategoryToEdit(null);
        }}
        onSave={() => {
          setIsFormModalVisible(false);
          setCategoryToEdit(null);
        }}
      />

      {/* Danger Confirm Modal */}
      <DangerConfirmModal
        visible={categoryToDelete !== null}
        title={t('categories.deleteTitle')}
        description={t('categories.deleteDesc', { name: categoryToDelete?.name || '' })}
        confirmLabel={t('common.delete')}
        onConfirm={handleConfirmDelete}
        onClose={() => setCategoryToDelete(null)}
      />
    </>
  );
}

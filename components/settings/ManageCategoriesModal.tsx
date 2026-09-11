import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, TouchableOpacity } from 'react-native';
import { Plus, Pencil, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Category } from '@/lib/db';
import { useFinanceStore } from '@/store/useFinanceStore';
import { SettingsBottomSheet } from './SettingsBottomSheet';
import { DangerConfirmModal } from './DangerConfirmModal';
import { CategoryFormModal } from '../categories/CategoryFormModal';

export interface ManageCategoriesModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ManageCategoriesModal({
  visible,
  onClose,
}: ManageCategoriesModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

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
      <SettingsBottomSheet
        visible={visible}
        onClose={onClose}
        title="Kelola Kategori"
        subtitle="Lihat daftar, buat, ubah, atau hapus kategori"
        maxHeight="90%"
      >
        <View className="px-5 pt-2 pb-3">
          {/* Top Actions: Segmented Tab & Add Button */}
          <View className="flex-row items-center justify-between mb-4">
            {/* Segmented Tab */}
            <View className="flex-row flex-1 mr-3 p-1 rounded-xl bg-linen-surface dark:bg-cypress-card border border-linen-border/60 dark:border-cypress-border/60">
              <Pressable
                onPress={() => setActiveTab('expense')}
                className={`flex-1 py-2 rounded-lg items-center justify-center ${
                  activeTab === 'expense'
                    ? isDark
                      ? 'bg-accent-champagne'
                      : 'bg-white shadow-xs border border-linen-border/40'
                    : ''
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    activeTab === 'expense'
                      ? isDark
                        ? 'text-black'
                        : 'text-linen-text-primary'
                      : 'text-linen-text-secondary dark:text-cypress-text-secondary'
                  }`}
                >
                  Pengeluaran
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab('income')}
                className={`flex-1 py-2 rounded-lg items-center justify-center ${
                  activeTab === 'income'
                    ? isDark
                      ? 'bg-accent-champagne'
                      : 'bg-white shadow-xs border border-linen-border/40'
                    : ''
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    activeTab === 'income'
                      ? isDark
                        ? 'text-black'
                        : 'text-linen-text-primary'
                      : 'text-linen-text-secondary dark:text-cypress-text-secondary'
                  }`}
                >
                  Pemasukan
                </Text>
              </Pressable>
            </View>

            {/* Quick Add Button */}
            <TouchableOpacity
              onPress={handleOpenAdd}
              activeOpacity={0.8}
              className={`flex-row items-center px-3.5 py-2.5 rounded-xl ${
                isDark ? 'bg-accent-champagne' : 'bg-cypress-surface'
              }`}
            >
              <Plus
                size={15}
                color={isDark ? '#0C1513' : '#FFFFFF'}
                strokeWidth={2.5}
              />
              <Text
                className={`text-xs font-bold ml-1 ${
                  isDark ? 'text-black' : 'text-white'
                }`}
              >
                Tambah
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories List */}
        <ScrollView
          className="px-5"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 32) }}
          showsVerticalScrollIndicator={false}
        >
          {filteredCategories.map((cat) => {
            const isDefault = Boolean(cat.isDefault);

            return (
              <View
                key={cat.id}
                className="flex-row items-center justify-between p-3.5 mb-2.5 rounded-2xl bg-linen-surface dark:bg-cypress-card border border-linen-border/80 dark:border-cypress-border/80"
              >
                {/* Left: Icon & Info */}
                <View className="flex-row items-center flex-1 mr-3">
                  <View className="w-10 h-10 rounded-xl bg-linen-bg dark:bg-cypress-surface border border-linen-border/60 dark:border-cypress-border/60 items-center justify-center mr-3">
                    <Text className="text-xl">{cat.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary"
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                    <View className="flex-row items-center mt-0.5">
                      <View
                        className={`px-1.5 py-0.5 rounded-md ${
                          isDefault
                            ? 'bg-linen-border/50 dark:bg-cypress-border/50'
                            : isDark
                            ? 'bg-accent-champagne/15'
                            : 'bg-status-safe/15'
                        }`}
                      >
                        <Text
                          className={`text-[9px] font-semibold ${
                            isDefault
                              ? 'text-linen-text-secondary dark:text-cypress-text-secondary'
                              : isDark
                              ? 'text-accent-champagne font-bold'
                              : 'text-status-safe font-bold'
                          }`}
                        >
                          {isDefault ? 'Bawaan' : 'Kustom'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Right: Actions */}
                <View className="flex-row items-center space-x-1.5">
                  {isDefault ? (
                    <Text className="text-[11px] text-linen-text-secondary/60 dark:text-cypress-text-secondary/60 italic mr-1">
                      Terkunci
                    </Text>
                  ) : (
                    <>
                      <TouchableOpacity
                        onPress={() => handleOpenEdit(cat)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        className="w-8 h-8 rounded-xl bg-linen-bg dark:bg-cypress-surface border border-linen-border dark:border-cypress-border items-center justify-center mr-1"
                      >
                        <Pencil size={14} color={colors.textSecondary} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setCategoryToDelete(cat)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        className="w-8 h-8 rounded-xl bg-status-danger/10 border border-status-danger/25 items-center justify-center"
                      >
                        <Trash2 size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </SettingsBottomSheet>

      {/* Edit or Add Category Modal */}
      <CategoryFormModal
        visible={isFormModalVisible}
        initialType={activeTab}
        categoryToEdit={categoryToEdit}
        onSave={() => {
          setIsFormModalVisible(false);
          setCategoryToEdit(null);
        }}
        onClose={() => {
          setIsFormModalVisible(false);
          setCategoryToEdit(null);
        }}
        colorScheme={colorScheme}
      />

      {/* Delete Confirmation Modal */}
      <DangerConfirmModal
        visible={Boolean(categoryToDelete)}
        title="Hapus Kategori?"
        description={`Kategori "${categoryToDelete?.name}" akan dihapus. Transaksi yang sebelumnya menggunakan kategori ini akan tetap tersimpan aman tanpa kategori.`}
        confirmLabel="Hapus Kategori"
        onConfirm={handleConfirmDelete}
        onClose={() => setCategoryToDelete(null)}
      />
    </>
  );
}

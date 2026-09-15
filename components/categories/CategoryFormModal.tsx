import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { Category } from '@/lib/db';
import { useFinanceStore } from '@/store/useFinanceStore';
import { AppModal } from '@/components/ui/AppModal';
import { AppSegmentedTabs } from '@/components/ui/AppSegmentedTabs';
import { useTranslation } from '@/lib/i18n';

export interface CategoryFormModalProps {
  visible: boolean;
  initialType?: 'expense' | 'income';
  categoryToEdit?: Category | null;
  onSave: (category: Category) => void;
  onClose: () => void;
  colorScheme: 'light' | 'dark';
}

const EXPENSE_EMOJIS = [
  '🍔', '☕', '🛒', '🍕', '🍜', '🧋',
  '🛵', '🚗', '⛽', '🏠', '💡', '📶',
  '🛍️', '👕', '🎮', '🎬', '📚', '✈️',
  '🐾', '💇', '🎁', '💄', '⚽', '🏋️',
  '💊', '🩺', '💳', '📦', '🍼', '🧹',
];

const INCOME_EMOJIS = [
  '💼', '💻', '💰', '💵', '📈', '🎁',
  '🏆', '🪙', '🏷️', '🏦', '🤝', '💎',
];

export function CategoryFormModal({
  visible,
  initialType = 'expense',
  categoryToEdit,
  onSave,
  onClose,
  colorScheme,
}: CategoryFormModalProps) {
  const { t, locale } = useTranslation();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const categories = useFinanceStore((s) => s.categories);
  const addCategory = useFinanceStore((s) => s.addCategory);
  const updateCategory = useFinanceStore((s) => s.updateCategory);

  const [type, setType] = useState<'expense' | 'income'>(initialType);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🍔');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (categoryToEdit) {
        setType(categoryToEdit.type as 'expense' | 'income');
        setName(categoryToEdit.name);
        setIcon(categoryToEdit.icon);
      } else {
        setType(initialType);
        setName('');
        setIcon(initialType === 'income' ? '💼' : '🍔');
      }
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [visible, categoryToEdit, initialType]);

  const handleTypeChange = (newType: 'expense' | 'income') => {
    setType(newType);
    if (!categoryToEdit) {
      setIcon(newType === 'income' ? '💼' : '🍔');
    }
    setErrorMessage(null);
  };

  const currentPresetEmojis = useMemo(
    () => (type === 'income' ? INCOME_EMOJIS : EXPENSE_EMOJIS),
    [type]
  );

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage(locale === 'en' ? 'Category name is required' : 'Nama kategori wajib diisi');
      return;
    }

    if (!icon.trim()) {
      setErrorMessage(locale === 'en' ? 'Please select or enter an emoji icon' : 'Pilih atau ketik 1 emoji icon');
      return;
    }

    const isDuplicate = categories.some(
      (c) =>
        c.type === type &&
        c.name.toLowerCase() === trimmedName.toLowerCase() &&
        c.id !== categoryToEdit?.id
    );

    if (isDuplicate) {
      setErrorMessage(
        locale === 'en'
          ? `Category "${trimmedName}" already exists for ${type}`
          : `Kategori "${trimmedName}" sudah ada untuk ${type === 'income' ? 'pemasukan' : 'pengeluaran'}`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (categoryToEdit) {
        await updateCategory(categoryToEdit.id, {
          name: trimmedName,
          icon: icon.trim(),
        });
        const updatedCat: Category = {
          ...categoryToEdit,
          name: trimmedName,
          icon: icon.trim(),
        };
        onSave(updatedCat);
      } else {
        const createdCat = await addCategory({
          name: trimmedName,
          type,
          icon: icon.trim(),
          isFixed: 0,
        });
        onSave(createdCat);
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to save category:', err);
      setErrorMessage(err?.message || (locale === 'en' ? 'Failed to save category' : 'Gagal menyimpan kategori'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalTitle = categoryToEdit
    ? t('categories.modalEditTitle')
    : t('categories.modalAddTitle');

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={modalTitle}
      showCloseButton={true}
      maxWidth={400}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={{ maxHeight: 420 }}
        contentContainerStyle={{ paddingBottom: 8 }}
      >
        {/* 1. Type Selector with AppSegmentedTabs */}
        {!categoryToEdit && (
          <View className="mb-3">
            <Text className="text-xs font-semibold text-linen-text-secondary dark:text-cypress-text-secondary mb-1.5">
              {t('categories.typeLabel')}
            </Text>
            <AppSegmentedTabs<'expense' | 'income'>
              value={type}
              onChange={handleTypeChange}
              options={[
                { key: 'expense', label: t('categories.tabExpense') },
                { key: 'income', label: t('categories.tabIncome') },
              ]}
            />
          </View>
        )}

        {/* 2. Category Name (Positioned on top of emojis, preventing auto-scroll clipping) */}
        <View className="mb-3">
          <Text className="text-xs font-semibold text-linen-text-secondary dark:text-cypress-text-secondary mb-1.5">
            {t('categories.nameLabel')}
          </Text>
          <TextInput
            value={name}
            onChangeText={(val) => {
              setName(val);
              setErrorMessage(null);
            }}
            placeholder={type === 'income' ? t('categories.namePlaceholderIncome') : t('categories.namePlaceholderExpense')}
            placeholderTextColor={colors.textSecondary}
            maxLength={30}
            style={{
              height: 46,
              textAlignVertical: 'center',
              paddingVertical: 8,
            }}
            className="px-3.5 rounded-xl bg-linen-surface dark:bg-cypress-card border border-linen-border/80 dark:border-cypress-border/80 text-linen-text-primary dark:text-cypress-text-primary text-sm font-medium"
          />
        </View>

        {/* 3. Icon Preview & Custom Input */}
        <View className="mb-3">
          <Text className="text-xs font-semibold text-linen-text-secondary dark:text-cypress-text-secondary mb-1.5">
            {t('categories.iconLabel')}
          </Text>
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-xl bg-linen-surface dark:bg-cypress-card border border-linen-border dark:border-cypress-border items-center justify-center shadow-xs mr-3">
              <Text
                style={{
                  fontSize: 24,
                  lineHeight: 30,
                  textAlign: 'center',
                  opacity: icon ? 1 : 0.35,
                }}
              >
                {icon || '🏷️'}
              </Text>
            </View>

            <View className="flex-1">
              <Text className="text-[10px] text-linen-text-secondary dark:text-cypress-text-secondary mb-1">
                {t('categories.iconInputHint')}
              </Text>
              <TextInput
                value={icon}
                onChangeText={(val) => {
                  setIcon(val);
                  setErrorMessage(null);
                }}
                placeholder="🎧"
                placeholderTextColor={colors.textSecondary}
                maxLength={4}
                style={{
                  height: 42,
                  textAlignVertical: 'center',
                  paddingVertical: 6,
                  fontSize: 14,
                }}
                className="px-3 rounded-xl bg-linen-surface dark:bg-cypress-card border border-linen-border/80 dark:border-cypress-border/80 text-linen-text-primary dark:text-cypress-text-primary font-medium"
              />
            </View>
          </View>
        </View>

        {/* 4. Quick Emoji Preset Grid */}
        <View className="mb-3">
          <Text className="text-[11px] font-semibold text-linen-text-secondary/80 dark:text-cypress-text-secondary/80 mb-1.5">
            {t('categories.quickEmojiLabel')}
          </Text>
          <View className="flex-row flex-wrap justify-start">
            {currentPresetEmojis.map((emojiItem) => {
              const isSelected = icon === emojiItem;
              return (
                <TouchableOpacity
                  key={emojiItem}
                  onPress={() => {
                    setIcon(emojiItem);
                    setErrorMessage(null);
                  }}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  activeOpacity={0.7}
                  className={`min-w-[40px] min-h-[40px] m-0.5 rounded-xl items-center justify-center border ${
                    isSelected
                      ? isDark
                        ? 'bg-accent-champagne/20 border-accent-champagne'
                        : 'bg-emerald-500/20 border-emerald-600'
                      : 'bg-linen-surface dark:bg-cypress-card border-linen-border/60 dark:border-cypress-border/60'
                  }`}
                >
                  <Text style={{ textAlign: 'center', fontSize: 18 }}>{emojiItem}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Error Banner */}
        {errorMessage ? (
          <View className="mb-3 p-2 rounded-xl bg-status-danger/15 border border-status-danger/30">
            <Text className="text-xs text-status-danger font-medium text-center">
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {/* Actions */}
        <View className="flex-row gap-2.5 mt-2">
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border items-center justify-center"
          >
            <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary">
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className={`flex-1 min-h-[44px] py-2.5 rounded-xl items-center justify-center ${
              isSubmitting
                ? 'bg-linen-border dark:bg-cypress-border'
                : 'bg-cypress-surface dark:bg-accent-champagne'
            }`}
          >
            <Text className="text-xs font-black text-white dark:text-[#0C1513]">
              {isSubmitting ? t('common.loading') : t('categories.saveButton')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AppModal>
  );
}
